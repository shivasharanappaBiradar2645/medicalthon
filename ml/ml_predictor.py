from prophet import Prophet
from sqlalchemy.orm import Session
from schema import FactDailyDemand, SessionLocal, DimPharmacy
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from geopy.distance import geodesic

def find_nearby_pharmacy(pharmacy_id: str, session: Session, max_distance_km=50):
    """Simple geo-check for sourcing from nearby surplus."""
    current_pharm = session.query(DimPharmacy).filter(DimPharmacy.id == pharmacy_id).first()
    if not current_pharm or not current_pharm.location:
        return None
    current_loc = tuple(map(float, current_pharm.location.split(',')))
    nearby = session.query(DimPharmacy).filter(DimPharmacy.id != pharmacy_id).all()
    for pharm in nearby:
        if pharm.location:
            nearby_loc = tuple(map(float, pharm.location.split(',')))
            dist = geodesic(current_loc, nearby_loc).km
            if dist < max_distance_km:
                # Assume surplus if stock > threshold (query facts for real check)
                return pharm.name
    return None

def train_and_predict(pharmacy_id: str, medicine_id: str, session: Session):
    hist = session.query(FactDailyDemand).filter(
        FactDailyDemand.pharmacy_id == pharmacy_id,
        FactDailyDemand.medicine_id == medicine_id,
        FactDailyDemand.date >= datetime.now() - timedelta(days=30)
    ).order_by(FactDailyDemand.date).all()
    
    if len(hist) < 7:
        # Fallback: Linear regression
        df = pd.DataFrame([{'ds': h.date, 'y': h.quantity_demanded} for h in hist])
        if len(df) < 2:
            return {'predicted_demand': 0, 'alert': None}
        X = np.arange(len(df)).reshape(-1, 1)
        model = LinearRegression().fit(X, df['y'].values)
        pred = max(0, model.predict([[len(df)]])[0])  # Non-negative
    else:
        # Prophet for seasonality (e.g., weekly opioid patterns)
        df = pd.DataFrame([{'ds': h.date, 'y': h.quantity_demanded} for h in hist])
        df['ds'] = pd.to_datetime(df['ds'])
        model = Prophet(daily_seasonality=True, weekly_seasonality=True, changepoint_prior_scale=0.05)
        model.fit(df)
        future = model.make_future_dataframe(periods=1)  # Next day
        forecast = model.predict(future)
        pred = max(0, forecast['yhat'].iloc[-1])

    current_stock = hist[-1].current_stock if hist else 0
    threshold = hist[-1].threshold
    alert = None
    if pred > current_stock + threshold:
        nearby = find_nearby_pharmacy(pharmacy_id, session)
        alert = f"Source from {nearby}" if nearby else "Restock from distributor"
        alert = f"{alert}: Predicted {pred:.0f} > stock {current_stock}"

    # Upsert prediction
    today = datetime.now().date()
    fact = session.query(FactDailyDemand).filter(
        FactDailyDemand.pharmacy_id == pharmacy_id,
        FactDailyDemand.medicine_id == medicine_id,
        FactDailyDemand.date == today
    ).first()
    if not fact:
        fact = FactDailyDemand(pharmacy_id=pharmacy_id, medicine_id=medicine_id, date=today,
                               quantity_demanded=0, is_opioid='OPIOID', current_stock=current_stock,
                               threshold=threshold)
        session.add(fact)
    fact.predicted_demand = pred
    fact.low_stock_alert = alert
    session.commit()
    return {'predicted_demand': pred, 'alert': alert}

def batch_predict():
    with SessionLocal() as session:
        # Batch over unique opioid combos
        unique_combos = session.query(FactDailyDemand.pharmacy_id, FactDailyDemand.medicine_id).filter(
            FactDailyDemand.is_opioid == 'OPIOID'
        ).distinct().all()
        alerts = []
        for pharm_id, med_id in unique_combos:
            pred = train_and_predict(pharm_id, med_id, session)
            if pred['alert']:
                alerts.append({'pharmacy_id': pharm_id, 'medicine_id': med_id, 'alert': pred['alert']})
        print(f"ML: Generated {len(alerts)} low-stock alerts for opioids.")
        return alerts