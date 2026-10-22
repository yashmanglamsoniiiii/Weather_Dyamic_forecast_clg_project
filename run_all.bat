@echo off
title AeroCast AI - Weather Forecast Project Launcher
echo ========================================================
echo   AeroCast AI - Full Stack ML Weather Forecast System
echo ========================================================
echo.

echo [1/3] Starting Python ML Microservice (FastAPI, Port 8000)...
start "AeroCast - Python ML Service (Port 8000)" cmd /k "cd /d D:\weather forecast_clg_project\ml-service\src && python -m uvicorn api:app --host 127.0.0.1 --port 8000"

timeout /t 3 /nobreak > nul

echo [2/3] Starting Node.js Express Backend (Port 5000)...
start "AeroCast - Express Backend (Port 5000)" cmd /k "cd /d D:\weather forecast_clg_project\server && npm start"

timeout /t 2 /nobreak > nul

echo [3/3] Starting React Vite Frontend (Port 3000)...
start "AeroCast - React Frontend (Port 3000)" cmd /k "cd /d D:\weather forecast_clg_project\client && npm run dev"

echo.
echo All services launched!
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:5000
echo ML API:   http://127.0.0.1:8000/docs
echo.
pause
