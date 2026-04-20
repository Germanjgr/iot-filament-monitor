from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database.connection import engine, Base
from backend.routers import sensor_router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="IoT Filament Monitor API",
    description="API para monitoreo de temperatura y humedad de filamento 3D",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sensor_router.router)


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "service": "IoT Filament Monitor API"}