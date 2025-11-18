from fastapi import FastAPI, BackgroundTasks
from etl_pipeline import bulk_upsert_facts
from ml_predictor import batch_predict
from schema import FactDailyDemand, SessionLocal
import uvicorn
import requests  # For Airflow push if needed

app = FastAPI(title="Pharmacy Stock Alerts API")

@app.post("/enqueue-etl")
async def enqueue_etl(background_tasks: BackgroundTasks):
    background_tasks.add_task(bulk_upsert_facts)
    return {"status": "ETL enqueued for opioid facts"}

@app.get("/alerts/{pharmacy_id}")
def get_alerts(pharmacy_id: str):
    with SessionLocal() as session:
        alerts = session.query(FactDailyDemand).filter(
            FactDailyDemand.pharmacy_id == pharmacy_id,
            FactDailyDemand.low_stock_alert.is_not(None),
            FactDailyDemand.is_opioid == 'OPIOID'
        ).all()
        return [{"medicine_id": a.medicine_id, "alert": a.low_stock_alert, "predicted": a.predicted_demand} for a in alerts]

@app.post("/trigger-ml")
def trigger_ml():
    alerts = batch_predict()
    # Push to frontend via webhook (e.g., your Node backend)
    # requests.post('http://node-backend:3000/alerts', json=alerts)
    return {"alerts_generated": len(alerts), "details": alerts}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)