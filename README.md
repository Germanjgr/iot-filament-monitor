# IoT Filament Monitor

Sistema de monitoreo de temperatura y humedad para almacenamiento de filamento 3D.

## Stack
- Backend: FastAPI + Python
- Database: Supabase (PostgreSQL)
- Frontend: React + Vite
- Firmware: ESP32 + Arduino C++


## Data Retention

Se ejecuta un job automático en Supabase cada medianoche que elimina
registros de más de 7 días para mantener la base de datos liviana.

Para verificar el job:
```sql
SELECT jobid, jobname, schedule, command FROM cron.job;
```

Para cancelarlo si es necesario:
```sql
SELECT cron.unschedule('delete-old-sensor-data');
```