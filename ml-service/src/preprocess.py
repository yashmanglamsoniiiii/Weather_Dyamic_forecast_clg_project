"""
Weather Forecast ML Project - Data Preprocessing & Feature Engineering
Extracts cyclical features, geospatial attributes, multi-horizon lags,
rolling statistical indicators, barometric tendencies, and performs time-based train/test splits.
"""

import os
import json
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
import joblib

FEATURE_COLUMNS = [
    # Cyclical temporal
    "hour_sin", "hour_cos",
    "month_sin", "month_cos",
    "doy_sin", "doy_cos",
    # Geospatial
    "latitude", "longitude", "elevation",
    # Current atmospheric state
    "temperature_2m", "relative_humidity_2m", "dew_point_2m",
    "surface_pressure", "cloud_cover", "wind_speed_10m",
    "temp_dew_diff",
    # Atmospheric lags
    "temp_lag_1", "temp_lag_3", "temp_lag_6", "temp_lag_24",
    "humidity_lag_1", "humidity_lag_3", "humidity_lag_6",
    "pressure_lag_1", "pressure_lag_3", "pressure_lag_6",
    "wind_lag_1", "wind_lag_3",
    "rain_lag_1", "rain_lag_3",
    # Tendencies & rolling features
    "pressure_diff_3h", "temp_diff_3h",
    "temp_roll_mean_6h", "temp_roll_std_6h",
    "humidity_roll_mean_6h"
]

TARGET_COLUMNS = {
    "temp": "target_temp",
    "humidity": "target_humidity",
    "wind": "target_wind",
    "pressure": "target_pressure",
    "rain": "target_rain"
}

def engineer_features(df):
    """Computes meteorological domain features, lags, and rolling aggregates."""
    df = df.copy()
    df["time"] = pd.to_datetime(df["time"])
    df = df.sort_values(by=["city", "time"]).reset_index(drop=True)

    # 1. Cyclical time encoding
    hours = df["time"].dt.hour
    months = df["time"].dt.month
    day_of_year = df["time"].dt.dayofyear

    df["hour_sin"] = np.sin(2 * np.pi * hours / 24.0)
    df["hour_cos"] = np.cos(2 * np.pi * hours / 24.0)
    df["month_sin"] = np.sin(2 * np.pi * months / 12.0)
    df["month_cos"] = np.cos(2 * np.pi * months / 12.0)
    df["doy_sin"] = np.sin(2 * np.pi * day_of_year / 365.25)
    df["doy_cos"] = np.cos(2 * np.pi * day_of_year / 365.25)

    # Dew point depression (difference between temp and dew point)
    df["temp_dew_diff"] = df["temperature_2m"] - df["dew_point_2m"]

    # Binary rain indicator for lags
    df["rain_binary"] = (df["rain"] > 0.05).astype(int)

    # 2. Lag features grouped by city
    grouped = df.groupby("city")

    for lag in [1, 3, 6, 24]:
        df[f"temp_lag_{lag}"] = grouped["temperature_2m"].shift(lag)
    for lag in [1, 3, 6]:
        df[f"humidity_lag_{lag}"] = grouped["relative_humidity_2m"].shift(lag)
        df[f"pressure_lag_{lag}"] = grouped["surface_pressure"].shift(lag)
    for lag in [1, 3]:
        df[f"wind_lag_{lag}"] = grouped["wind_speed_10m"].shift(lag)
        df[f"rain_lag_{lag}"] = grouped["rain_binary"].shift(lag)

    # 3. Barometric and temperature tendency
    df["pressure_diff_3h"] = df["surface_pressure"] - df["pressure_lag_3"]
    df["temp_diff_3h"] = df["temperature_2m"] - df["temp_lag_3"]

    # 4. Rolling statistics (last 6 hours)
    df["temp_roll_mean_6h"] = grouped["temperature_2m"].transform(lambda x: x.rolling(6, min_periods=3).mean())
    df["temp_roll_std_6h"] = grouped["temperature_2m"].transform(lambda x: x.rolling(6, min_periods=3).std().fillna(0))
    df["humidity_roll_mean_6h"] = grouped["relative_humidity_2m"].transform(lambda x: x.rolling(6, min_periods=3).mean())

    # 5. Target creation (t+1 forecast)
    df["target_temp"] = grouped["temperature_2m"].shift(-1)
    df["target_humidity"] = grouped["relative_humidity_2m"].shift(-1)
    df["target_wind"] = grouped["wind_speed_10m"].shift(-1)
    df["target_pressure"] = grouped["surface_pressure"].shift(-1)
    df["target_rain"] = grouped["rain_binary"].shift(-1)

    # Drop NaNs created by shifts and lags
    df_clean = df.dropna().reset_index(drop=True)
    return df_clean

def split_and_save(
    input_file="D:/weather forecast_clg_project/ml-service/data/raw/era5_hourly_data.csv",
    output_dir="D:/weather forecast_clg_project/ml-service/data/processed",
    models_dir="D:/weather forecast_clg_project/ml-service/models"
):
    """Loads raw data, performs feature engineering, chronological train/test split, and saves files."""
    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(models_dir, exist_ok=True)

    print(f"[*] Loading raw ERA5 data from {input_file}...")
    df_raw = pd.read_csv(input_file)
    print(f"    Raw records: {len(df_raw)}")

    print("[*] Engineering meteorological features, lags, and rolling aggregates...")
    df_feat = engineer_features(df_raw)
    print(f"    Clean records after feature generation: {len(df_feat)}")

    # Time-based split: Use chronologically last 20% of each city as test set
    train_dfs = []
    test_dfs = []

    for city, city_df in df_feat.groupby("city"):
        city_df = city_df.sort_values(by="time").reset_index(drop=True)
        split_idx = int(len(city_df) * 0.8)
        train_dfs.append(city_df.iloc[:split_idx])
        test_dfs.append(city_df.iloc[split_idx:])

    train_df = pd.concat(train_dfs, ignore_index=True)
    test_df = pd.concat(test_dfs, ignore_index=True)

    print(f"[+] Train split: {len(train_df)} rows")
    print(f"[+] Test split:  {len(test_df)} rows")

    train_path = os.path.join(output_dir, "train.csv")
    test_path = os.path.join(output_dir, "test.csv")
    train_df.to_csv(train_path, index=False)
    test_df.to_csv(test_path, index=False)

    # Save feature names list
    feature_meta_path = os.path.join(models_dir, "feature_names.json")
    with open(feature_meta_path, "w") as f:
        json.dump(FEATURE_COLUMNS, f, indent=2)

    print(f"[+] Processed data saved to {output_dir}")
    print(f"[+] Feature metadata saved to {feature_meta_path}")
    return train_df, test_df

if __name__ == "__main__":
    split_and_save()
