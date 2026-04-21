from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from backend.models.sensor_data import SensorData
from backend.schemas.sensor_data import SensorDataCreate


def calcular_riesgo(humidity: float) -> str:
    if humidity < 40.0:
        return "SAFE"
    elif humidity <= 55.0:
        return "WARNING"
    else:
        return "RISK"


def crear_lectura(db: Session, data: SensorDataCreate) -> SensorData:
    risk_level = calcular_riesgo(data.humidity)

    registro = SensorData(
        device_id   = data.device_id,
        temperature = data.temperature,
        humidity    = data.humidity,
        risk_level  = risk_level,
        timestamp   = data.timestamp,
    )

    db.add(registro)
    db.commit()
    db.refresh(registro)
    return registro


def obtener_historial(
    db:        Session,
    device_id: Optional[str] = None,
    limit:     int = 100,
    hours:     int = 24,
) -> List[SensorData]:
    cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)

    query = db.query(SensorData).filter(
        SensorData.timestamp >= cutoff
    )

    if device_id:
        query = query.filter(SensorData.device_id == device_id)

    return query.order_by(desc(SensorData.timestamp)).limit(limit).all()


def obtener_alertas(
    db:        Session,
    device_id: Optional[str] = None,
    limit:     int = 50,
) -> List[SensorData]:
    query = db.query(SensorData).filter(
        SensorData.risk_level == "RISK"
    )

    if device_id:
        query = query.filter(SensorData.device_id == device_id)

    return query.order_by(desc(SensorData.timestamp)).limit(limit).all()