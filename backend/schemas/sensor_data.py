from pydantic import BaseModel, Field, validator
from datetime import datetime
from typing import List, Optional


class SensorDataCreate(BaseModel):
    temperature: float = Field(..., ge=-40, le=125)
    humidity:    float = Field(..., ge=0, le=100)
    device_id:   str   = Field(..., min_length=1, max_length=64)
    timestamp:   datetime

    class Config:
        json_schema_extra = {
            "example": {
                "temperature": 24.5,
                "humidity":    48.2,
                "device_id":   "ESP32-FILAMENT-01",
                "timestamp":   "2024-06-01T12:00:00Z"
            }
        }


class SensorDataResponse(BaseModel):
    id:          int
    device_id:   str
    temperature: float
    humidity:    float
    risk_level:  str
    timestamp:   datetime
    created_at:  datetime

    class Config:
        from_attributes = True


class AlertResponse(BaseModel):
    id:          int
    device_id:   str
    temperature: float
    humidity:    float
    risk_level:  str
    timestamp:   datetime

    class Config:
        from_attributes = True