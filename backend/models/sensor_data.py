from sqlalchemy import Column, Integer, String, Float, DateTime, func, BigInteger
from sqlalchemy.orm import DeclarativeBase
from backend.database.connection import Base


class SensorData(Base):
    __tablename__ = "sensor_data"

    id          = Column(BigInteger, primary_key=True, index=True)
    device_id   = Column(String(64), nullable=False, index=True)
    temperature = Column(Float, nullable=False)
    humidity    = Column(Float, nullable=False)
    risk_level  = Column(String(16), nullable=False)
    timestamp   = Column(DateTime(timezone=True), nullable=False, index=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())