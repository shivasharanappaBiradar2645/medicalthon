from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.sensors.http import HttpSensor
import sys
sys.path.append('/path/to/your/project')  # Update path
from etl_pipeline import extract_and_transform, bulk_upsert_facts
from ml_predictor import batch_predict
import requests

default_args = {
    'owner': 'pharmacy-ml',
    'start_date': datetime(2025, 11, 12),
    'retries': 3,
    'retry_delay': timedelta(minutes=5),
}

dag = DAG('opioid_stock_predictor', default_args=default_args, schedule_interval='0 * * * *', catchup=False, tags=['pharmacy', 'ml'])

def etl_task(**context):
    df = extract_and_transform()
    bulk_upsert_facts(df)
    context['ti'].xcom_push(key='etl_rows', value=len(df))

def ml_task(**context):
    alerts = batch_predict()
    etl_rows = context['ti'].xcom_pull(key='etl_rows')
    print(f"Processed {etl_rows} facts → {len(alerts)} alerts")
    # Optional: Push to FastAPI
    requests.post('http://fastapi:8000/trigger-ml', json={'run': True})

# Trigger sensor for Node/Drizzle events
trigger_sensor = HttpSensor(
    task_id='wait_for_backend_trigger',
    http_conn_id='fastapi_default',  # Setup in Airflow UI
    endpoint='/enqueue-etl',
    timeout=300,
    poke_interval=30,
    dag=dag,
)

etl_op = PythonOperator(task_id='run_etl', python_callable=etl_task, dag=dag)
ml_op = PythonOperator(task_id='run_ml', python_callable=ml_task, dag=dag)

trigger_sensor >> etl_op >> ml_op