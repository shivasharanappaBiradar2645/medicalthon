import psycopg2
from psycopg2.extras import execute_values
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from schema import FactDailyDemand, DimPharmacy, SessionLocal, MedicineType
import pandas as pd
from geopy.distance import geodesic  # For nearby pharmacy calc

OPS_CONN = psycopg2.connect('postgresql://user:pass@localhost/ops_db')  # Drizzle DB
OPS_CUR = OPS_CONN.cursor()

def extract_and_transform():
    yesterday = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
    # Opioid-focused aggregation from ops tables
    query = f"""
    SELECT 
        p.id as pharmacy_id, t.medicine_id, DATE(t.dispensed_at) as date,
        SUM(t.quantity_dispensed) as quantity_demanded,
        COUNT(DISTINCT pr.id) as prescriptions_filled,
        AVG(pm.dosage::numeric) as avg_dosage,
        m.type as is_opioid,
        i.quantity as current_stock,
        COALESCE(i.threshold, 10) as threshold,
        dp.location
    FROM pharmacies p
    JOIN inventories i ON p.id = i.pharmacy_id
    JOIN transactions t ON i.pharmacy_id = t.pharmacy_id AND i.medicine_id = t.medicine_id
    JOIN prescriptions pr ON t.prescription_id = pr.id
    JOIN prescription_medicines pm ON pr.id = pm.prescription_id AND t.medicine_id = pm.medicine_id
    JOIN medicines m ON t.medicine_id = m.id
    LEFT JOIN dim_pharmacy dp ON p.id = dp.id  -- Enrich geo
    WHERE DATE(t.dispensed_at) >= '{yesterday}' AND m.type = 'OPIOID'
    GROUP BY p.id, t.medicine_id, DATE(t.dispensed_at), m.type, i.quantity, i.threshold, dp.location
    """
    OPS_CUR.execute(query)
    rows = OPS_CUR.fetchall()
    df = pd.DataFrame(rows, columns=['pharmacy_id', 'medicine_id', 'date', 'quantity_demanded', 
                                     'prescriptions_filled', 'avg_dosage', 'is_opioid', 
                                     'current_stock', 'threshold', 'location'])
    df.fillna(0, inplace=True)

    # Feature engineering: 7-day rolling avg
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values(['pharmacy_id', 'medicine_id', 'date'])
    df['rolling_demand_7d'] = df.groupby(['pharmacy_id', 'medicine_id'])['quantity_demanded'].rolling(7).mean().reset_index(0, drop=True)
    return df

def bulk_upsert_facts(df: pd.DataFrame):
    with SessionLocal() as session:
        # Upsert dim_pharmacy first (static)
        for _, row in df.iterrows():
            if row['location']:
                pharmacy = DimPharmacy(id=row['pharmacy_id'], location=row['location'])
                session.merge(pharmacy)
        session.commit()

        # Bulk fact upsert
        data = [(None, row['pharmacy_id'], row['medicine_id'], row['date'], 
                 int(row['prescriptions_filled']), int(row['quantity_demanded']), 
                 float(row['avg_dosage']), row['is_opioid'], 
                 int(row['current_stock']), int(row['threshold'])) 
                for _, row in df.iterrows()]
        conn = session.bind.raw_connection()
        cur = conn.cursor()
        execute_values(cur, """
            INSERT INTO fact_daily_demand (pharmacy_id, medicine_id, date, prescriptions_filled, quantity_demanded, 
                                           avg_dosage, is_opioid, current_stock, threshold)
            VALUES %s ON CONFLICT (pharmacy_id, medicine_id, date) 
            DO UPDATE SET quantity_demanded = EXCLUDED.quantity_demanded, 
                          current_stock = EXCLUDED.current_stock, 
                          threshold = EXCLUDED.threshold
        """, data, page_size=1000)
        conn.commit()
        cur.close()
        print(f"ETL: Upserted {len(data)} opioid demand facts.")

if __name__ == '__main__':
    df = extract_and_transform()
    bulk_upsert_facts(df)
    OPS_CONN.close()