from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from backend.database.connection import get_db
from backend.schemas.sensor_data import (
    SensorDataCreate,
    SensorDataResponse,
    AlertResponse,
)
from backend.services import sensor_service

router = APIRouter(prefix="/sensor-data", tags=["Sensor Data"])


@router.post("", response_model=SensorDataResponse, status_code=201)
def recibir_datos(
    payload: SensorDataCreate,
    db: Session = Depends(get_db)
):
    return sensor_service.crear_lectura(db, payload)


@router.get("", response_model=List[SensorDataResponse])
def listar_datos(
    device_id: Optional[str] = None,
    limit: int = 100,
    hours: int = 24,
    db: Session = Depends(get_db)
):
    return sensor_service.obtener_historial(
        db,
        device_id=device_id,
        limit=limit,
        hours=hours
    )


@router.get("/alerts", response_model=List[AlertResponse])
def listar_alertas(
    device_id: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    return sensor_service.obtener_alertas(
        db,
        device_id=device_id,
        limit=limit
    )