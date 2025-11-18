from sqlalchemy import create_engine, Column, Integer, Float, DateTime, String, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import enum

Base = declarative_base()
engine = create_engine('postgresql://user:pass@localhost/analytics_db')  # Update URL
SessionLocal = sessionmaker(bind=engine)

class MedicineType(enum.Enum):
    GENERAL = "GENERAL"
    OPIOID = "OPIOID"
    CONTROLLED = "CONTROLLED"

class FactDailyDemand(Base):
    __tablename__ = 'fact_daily_demand'
    id = Column(Integer, primary_key=True, autoincrement=True)
    pharmacy_id = Column(String(36), nullable=False)  # UUID as str
    medicine_id = Column(String(36), nullable=False)
    date = Column(DateTime, default=func.now())
    prescriptions_filled = Column(Integer, default=0)
    quantity_demanded = Column(Integer, default=0)
    avg_dosage = Column(Float)
    is_opioid = Column(String(10), default='GENERAL')
    current_stock = Column(Integer, default=0)
    threshold = Column(Integer, default=10)
    predicted_demand = Column(Float, nullable=True)
    low_stock_alert = Column(String(255), nullable=True)  # e.g., "Restock from distributor"

class DimPharmacy(Base):
    __tablename__ = 'dim_pharmacy'
    id = Column(String(36), primary_key=True)
    name = Column(String(100))
    location = Column(String(255))  # e.g., "lat,long" for geo

# Run once: Base.metadata.create_all(engine)