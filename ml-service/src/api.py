"""
Weather Forecast ML Project - FastAPI Microservice
Serves predictions from trained XGBoost and LightGBM models.
Exposes /health, /metrics, /predict, and /forecast-24h.
"""

import os
import json
from datetime import datetime, timedelta
from typing import List, Optional
import numpy as np
import pandas as pd
import joblib
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")

app = FastAPI(
    title="Weather Forecast ML Microservice",
    description="Inference server trained on ECMWF Copernicus ERA5 Reanalysis data",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model store
models = {}
feature_cols = []
metrics_data = {}

def load_all_models():
    global models, feature_cols, metrics_data
    try:
        models["temp"] = joblib.load(os.path.join(MODELS_DIR, "temp_model.joblib"))
        models["humidity"] = joblib.load(os.path.join(MODELS_DIR, "humidity_model.joblib"))
        models["wind"] = joblib.load(os.path.join(MODELS_DIR, "wind_model.joblib"))
        models["pressure"] = joblib.load(os.path.join(MODELS_DIR, "pressure_model.joblib"))
        models["rain"] = joblib.load(os.path.join(MODELS_DIR, "rain_model.joblib"))

        with open(os.path.join(MODELS_DIR, "feature_names.json"), "r") as f:
            feature_cols = json.load(f)

        metrics_file = os.path.join(MODELS_DIR, "metrics.json")
        if os.path.exists(metrics_file):
            with open(metrics_file, "r") as f:
                metrics_data.clear()
                metrics_data.update(json.load(f))

        print(f"[+] Successfully loaded 5 ML models and {len(feature_cols)} feature definitions.")
    except Exception as e:
        print(f"[!] Warning: Error loading models from {MODELS_DIR}: {e}")

@app.on_event("startup")
def startup_event():
    load_all_models()

# Pydantic Schemas
class WeatherObservation(BaseModel):
    time: Optional[str] = None
    temperature_2m: float = Field(..., description="Temperature at 2m in Celsius")
    relative_humidity_2m: float = Field(..., description="Relative humidity in percentage (0-100)")
    dew_point_2m: Optional[float] = None
    surface_pressure: Optional[float] = Field(default=1013.25, description="Surface pressure in hPa")
    cloud_cover: Optional[float] = Field(default=20.0, description="Cloud cover percentage (0-100)")
    wind_speed_10m: Optional[float] = Field(default=10.0, description="Wind speed at 10m in km/h")
    rain: Optional[float] = Field(default=0.0, description="Precipitation / rain in mm")

class PredictionRequest(BaseModel):
    city_name: Optional[str] = "Selected Location"
    latitude: float
    longitude: float
    elevation: Optional[float] = 20.0
    current: WeatherObservation
    # Optional history: list of past observations (hourly, up to 24h)
    history: Optional[List[WeatherObservation]] = None

def construct_feature_row(req: PredictionRequest, target_time: datetime, current_obs: WeatherObservation, history_series: dict):
    """Builds a single pandas DataFrame row matching the exact feature pipeline."""
    hour = target_time.hour
    month = target_time.month
    doy = target_time.timetuple().tm_yday

    temp = current_obs.temperature_2m
    humidity = current_obs.relative_humidity_2m
    dew_point = current_obs.dew_point_2m
    if dew_point is None:
        # Approximate dew point from temp and RH via Magnus-Tetens
        dew_point = temp - ((100 - humidity) / 5.0)

    pressure = current_obs.surface_pressure or 1013.25
    cloud = current_obs.cloud_cover if current_obs.cloud_cover is not None else 25.0
    wind = current_obs.wind_speed_10m if current_obs.wind_speed_10m is not None else 10.0
    rain_val = current_obs.rain if current_obs.rain is not None else 0.0

    # Lags from history or physically consistent approximations
    temp_hist = history_series.get("temp", [temp] * 25)
    hum_hist = history_series.get("humidity", [humidity] * 25)
    press_hist = history_series.get("pressure", [pressure] * 25)
    wind_hist = history_series.get("wind", [wind] * 25)
    rain_hist = history_series.get("rain", [rain_val] * 25)

    def get_lag(arr, step):
        idx = -step - 1
        return arr[idx] if len(arr) >= step + 1 else arr[0]

    temp_lag_1 = get_lag(temp_hist, 1)
    temp_lag_3 = get_lag(temp_hist, 3)
    temp_lag_6 = get_lag(temp_hist, 6)
    temp_lag_24 = get_lag(temp_hist, 24)

    hum_lag_1 = get_lag(hum_hist, 1)
    hum_lag_3 = get_lag(hum_hist, 3)
    hum_lag_6 = get_lag(hum_hist, 6)

    press_lag_1 = get_lag(press_hist, 1)
    press_lag_3 = get_lag(press_hist, 3)
    press_lag_6 = get_lag(press_hist, 6)

    wind_lag_1 = get_lag(wind_hist, 1)
    wind_lag_3 = get_lag(wind_hist, 3)

    rain_lag_1 = 1 if get_lag(rain_hist, 1) > 0.05 else 0
    rain_lag_3 = 1 if get_lag(rain_hist, 3) > 0.05 else 0

    recent_6_temps = temp_hist[-6:] if len(temp_hist) >= 6 else [temp] * 6
    recent_6_hums = hum_hist[-6:] if len(hum_hist) >= 6 else [humidity] * 6

    feature_dict = {
        "hour_sin": np.sin(2 * np.pi * hour / 24.0),
        "hour_cos": np.cos(2 * np.pi * hour / 24.0),
        "month_sin": np.sin(2 * np.pi * month / 12.0),
        "month_cos": np.cos(2 * np.pi * month / 12.0),
        "doy_sin": np.sin(2 * np.pi * doy / 365.25),
        "doy_cos": np.cos(2 * np.pi * doy / 365.25),
        "latitude": req.latitude,
        "longitude": req.longitude,
        "elevation": req.elevation or 20.0,
        "temperature_2m": temp,
        "relative_humidity_2m": humidity,
        "dew_point_2m": dew_point,
        "surface_pressure": pressure,
        "cloud_cover": cloud,
        "wind_speed_10m": wind,
        "temp_dew_diff": temp - dew_point,
        "temp_lag_1": temp_lag_1,
        "temp_lag_3": temp_lag_3,
        "temp_lag_6": temp_lag_6,
        "temp_lag_24": temp_lag_24,
        "humidity_lag_1": hum_lag_1,
        "humidity_lag_3": hum_lag_3,
        "humidity_lag_6": hum_lag_6,
        "pressure_lag_1": press_lag_1,
        "pressure_lag_3": press_lag_3,
        "pressure_lag_6": press_lag_6,
        "wind_lag_1": wind_lag_1,
        "wind_lag_3": wind_lag_3,
        "rain_lag_1": rain_lag_1,
        "rain_lag_3": rain_lag_3,
        "pressure_diff_3h": pressure - press_lag_3,
        "temp_diff_3h": temp - temp_lag_3,
        "temp_roll_mean_6h": float(np.mean(recent_6_temps)),
        "temp_roll_std_6h": float(np.std(recent_6_temps)),
        "humidity_roll_mean_6h": float(np.mean(recent_6_hums))
    }

    # Format to DataFrame matching training columns
    df_row = pd.DataFrame([feature_dict])[feature_cols]
    return df_row

def determine_weather_condition(temp, rain_prob, wind, cloud, is_day=True):
    """Categorizes weather state for 3D graphics and UI presentation."""
    if temp <= 0 and rain_prob >= 0.40:
        return {"main": "Snow", "description": "Snowfall", "icon": "snowflake", "theme": "snow"}
    if rain_prob >= 0.70:
        if wind > 28.0:
            return {"main": "Thunderstorm", "description": "Storm with Heavy Rain", "icon": "cloud-lightning", "theme": "thunder"}
        return {"main": "Heavy Rain", "description": "Continuous Rainfall", "icon": "cloud-rain", "theme": "rain"}
    if rain_prob >= 0.35:
        return {"main": "Rain", "description": "Light / Passing Showers", "icon": "cloud-drizzle", "theme": "rain"}
    if cloud >= 75:
        return {"main": "Overcast", "description": "Dense Cloud Cover", "icon": "cloud", "theme": "cloudy"}
    if cloud >= 35:
        return {"main": "Partly Cloudy", "description": "Scattered Clouds", "icon": "cloud-sun", "theme": "partly-cloudy"}
    if wind >= 30:
        return {"main": "Windy", "description": "High Wind Gale", "icon": "wind", "theme": "windy"}
    
    return {
        "main": "Clear" if is_day else "Clear Night",
        "description": "Clear Sunny Skies" if is_day else "Clear Starlit Sky",
        "icon": "sun" if is_day else "moon",
        "theme": "sunny" if is_day else "night"
    }

@app.get("/health")
def health_check():
    loaded = len(models) == 5
    return {
        "status": "healthy" if loaded else "degraded",
        "models_loaded": list(models.keys()),
        "features_count": len(feature_cols),
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/metrics")
def get_metrics():
    if not metrics_data:
        raise HTTPException(status_code=404, detail="Model metrics not found. Train models first.")
    return metrics_data

@app.post("/predict")
def predict_next_hour(req: PredictionRequest):
    if not models or len(models) < 5:
        raise HTTPException(status_code=500, detail="Models are not initialized.")

    now = datetime.utcnow()
    # Build history arrays
    hist = {"temp": [], "humidity": [], "pressure": [], "wind": [], "rain": []}
    if req.history:
        for obs in req.history:
            hist["temp"].append(obs.temperature_2m)
            hist["humidity"].append(obs.relative_humidity_2m)
            hist["pressure"].append(obs.surface_pressure or 1013.25)
            hist["wind"].append(obs.wind_speed_10m or 10.0)
            hist["rain"].append(obs.rain or 0.0)
    else:
        # Default with current observation
        hist["temp"] = [req.current.temperature_2m] * 25
        hist["humidity"] = [req.current.relative_humidity_2m] * 25
        hist["pressure"] = [req.current.surface_pressure or 1013.25] * 25
        hist["wind"] = [req.current.wind_speed_10m or 10.0] * 25
        hist["rain"] = [req.current.rain or 0.0] * 25

    # Target hour is next hour (t+1)
    target_time = now + timedelta(hours=1)
    df_features = construct_feature_row(req, target_time, req.current, hist)

    pred_temp = float(models["temp"].predict(df_features)[0])
    pred_hum = float(np.clip(models["humidity"].predict(df_features)[0], 0, 100))
    pred_wind = float(np.clip(models["wind"].predict(df_features)[0], 0, None))
    pred_press = float(models["pressure"].predict(df_features)[0])
    rain_prob = float(models["rain"].predict_proba(df_features)[0, 1])
    rain_yes_no = bool(rain_prob >= 0.50)

    condition = determine_weather_condition(
        temp=pred_temp,
        rain_prob=rain_prob,
        wind=pred_wind,
        cloud=req.current.cloud_cover or 30.0,
        is_day=(6 <= target_time.hour < 20)
    )

    return {
        "city": req.city_name,
        "coordinates": {"latitude": req.latitude, "longitude": req.longitude},
        "forecast_time": target_time.isoformat(),
        "temperature_celsius": round(pred_temp, 1),
        "temperature_fahrenheit": round((pred_temp * 9/5) + 32, 1),
        "relative_humidity": round(pred_hum, 1),
        "wind_speed_kmh": round(pred_wind, 1),
        "surface_pressure_hpa": round(pred_press, 1),
        "rain_probability": round(rain_prob * 100, 1),
        "rain_forecast": "Rain Expected" if rain_yes_no else "No Rain Expected",
        "rain_yes_no": rain_yes_no,
        "condition": condition,
        "model_engine": "XGBoost + LightGBM (ECMWF ERA5 Reanalysis)"
    }

@app.post("/forecast-24h")
def forecast_24h(req: PredictionRequest):
    """Generates an autoregressive 24-hour hourly forecast sequence."""
    if not models or len(models) < 5:
        raise HTTPException(status_code=500, detail="Models are not initialized.")

    now = datetime.utcnow()
    hourly_results = []

    # Initialize rolling state
    current_obs = WeatherObservation(
        temperature_2m=req.current.temperature_2m,
        relative_humidity_2m=req.current.relative_humidity_2m,
        dew_point_2m=req.current.dew_point_2m,
        surface_pressure=req.current.surface_pressure or 1013.25,
        cloud_cover=req.current.cloud_cover or 25.0,
        wind_speed_10m=req.current.wind_speed_10m or 10.0,
        rain=req.current.rain or 0.0
    )

    hist = {
        "temp": [req.current.temperature_2m] * 25,
        "humidity": [req.current.relative_humidity_2m] * 25,
        "pressure": [req.current.surface_pressure or 1013.25] * 25,
        "wind": [req.current.wind_speed_10m or 10.0] * 25,
        "rain": [req.current.rain or 0.0] * 25
    }

    if req.history:
        for obs in req.history:
            hist["temp"].append(obs.temperature_2m)
            hist["humidity"].append(obs.relative_humidity_2m)
            hist["pressure"].append(obs.surface_pressure or 1013.25)
            hist["wind"].append(obs.wind_speed_10m or 10.0)
            hist["rain"].append(obs.rain or 0.0)

    sim_time = now
    for step in range(1, 25):
        sim_time += timedelta(hours=1)
        df_feat = construct_feature_row(req, sim_time, current_obs, hist)

        step_temp = float(models["temp"].predict(df_feat)[0])
        step_hum = float(np.clip(models["humidity"].predict(df_feat)[0], 0, 100))
        step_wind = float(np.clip(models["wind"].predict(df_feat)[0], 0, None))
        step_press = float(models["pressure"].predict(df_feat)[0])
        step_rain_prob = float(models["rain"].predict_proba(df_feat)[0, 1])
        step_rain_bool = bool(step_rain_prob >= 0.50)

        is_day = 6 <= sim_time.hour < 20
        cond = determine_weather_condition(
            temp=step_temp,
            rain_prob=step_rain_prob,
            wind=step_wind,
            cloud=current_obs.cloud_cover or 30.0,
            is_day=is_day
        )

        hourly_results.append({
            "step": step,
            "time": sim_time.strftime("%H:00"),
            "full_time": sim_time.isoformat(),
            "temperature": round(step_temp, 1),
            "humidity": round(step_hum, 1),
            "wind_speed": round(step_wind, 1),
            "pressure": round(step_press, 1),
            "rain_probability": round(step_rain_prob * 100, 1),
            "rain": step_rain_bool,
            "condition": cond["main"],
            "description": cond["description"],
            "icon": cond["icon"],
            "theme": cond["theme"]
        })

        # Autoregressive update for next hour
        hist["temp"].append(step_temp)
        hist["humidity"].append(step_hum)
        hist["pressure"].append(step_press)
        hist["wind"].append(step_wind)
        hist["rain"].append(1.0 if step_rain_bool else 0.0)

        current_obs.temperature_2m = step_temp
        current_obs.relative_humidity_2m = step_hum
        current_obs.surface_pressure = step_press
        current_obs.wind_speed_10m = step_wind
        current_obs.rain = 1.0 if step_rain_bool else 0.0

    return {
        "city": req.city_name,
        "coordinates": {"latitude": req.latitude, "longitude": req.longitude},
        "generated_at": now.isoformat(),
        "forecast_hours": hourly_results
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="127.0.0.1", port=8000, reload=False)
