"""
Weather Forecast ML Project - ERA5 Historical Data Downloader
Downloads hourly ERA5 reanalysis data via Open-Meteo Historical Archive API.
Official Copernicus ECMWF ERA5 reanalysis dataset.
"""

import os
import time
import requests
import pandas as pd
from datetime import datetime

# Reference cities covering distinct climatic zones
CITIES = [
    {"name": "London", "lat": 51.5074, "lon": -0.1278, "elevation": 25.0, "climate": "Temperate Oceanic"},
    {"name": "New York", "lat": 40.7128, "lon": -74.0060, "elevation": 10.0, "climate": "Humid Continental"},
    {"name": "Tokyo", "lat": 35.6762, "lon": 139.6503, "elevation": 40.0, "climate": "Humid Subtropical"},
    {"name": "Mumbai", "lat": 19.0760, "lon": 72.8777, "elevation": 14.0, "climate": "Tropical Wet-Dry"},
    {"name": "Berlin", "lat": 52.5200, "lon": 13.4050, "elevation": 34.0, "climate": "Maritime / Continental"},
    {"name": "Sydney", "lat": -33.8688, "lon": 151.2093, "elevation": 19.0, "climate": "Subtropical Oceanic"}
]

ARCHIVE_API_URL = "https://archive-api.open-meteo.com/v1/archive"
START_DATE = "2023-01-01"
END_DATE = "2023-12-31"

HOURLY_VARIABLES = [
    "temperature_2m",
    "relative_humidity_2m",
    "dew_point_2m",
    "apparent_temperature",
    "surface_pressure",
    "cloud_cover",
    "wind_speed_10m",
    "wind_direction_10m",
    "precipitation",
    "rain"
]

def fetch_city_era5(city_info, start_date=START_DATE, end_date=END_DATE):
    """Fetch hourly ERA5 reanalysis data for a city."""
    print(f"[*] Downloading ERA5 data for {city_info['name']} ({city_info['climate']})...")
    
    params = {
        "latitude": city_info["lat"],
        "longitude": city_info["lon"],
        "start_date": start_date,
        "end_date": end_date,
        "hourly": ",".join(HOURLY_VARIABLES),
        "timezone": "UTC"
    }

    try:
        response = requests.get(ARCHIVE_API_URL, params=params, timeout=30)
        response.raise_for_status()
        data = response.json()
        
        hourly = data.get("hourly", {})
        if not hourly or "time" not in hourly:
            raise ValueError(f"No hourly data returned for {city_info['name']}")
        
        df = pd.DataFrame(hourly)
        df["city"] = city_info["name"]
        df["latitude"] = city_info["lat"]
        df["longitude"] = city_info["lon"]
        df["elevation"] = city_info["elevation"]
        df["time"] = pd.to_datetime(df["time"])
        print(f"    [+] Successfully fetched {len(df)} records for {city_info['name']}.")
        return df
    except Exception as e:
        print(f"    [!] Error fetching data for {city_info['name']}: {e}")
        return None

def download_dataset(output_dir="D:/weather forecast_clg_project/ml-service/data/raw"):
    """Downloads ERA5 reanalysis data for all cities and saves combined CSV."""
    os.makedirs(output_dir, exist_ok=True)
    all_dfs = []
    
    for city in CITIES:
        df = fetch_city_era5(city)
        if df is not None:
            all_dfs.append(df)
        time.sleep(1) # respectful API rate limiting

    if not all_dfs:
        raise RuntimeError("Failed to download any ERA5 historical data from Open-Meteo.")

    combined_df = pd.concat(all_dfs, ignore_index=True)
    output_path = os.path.join(output_dir, "era5_hourly_data.csv")
    combined_df.to_csv(output_path, index=False)
    print(f"\n[+] Total records downloaded: {len(combined_df)}")
    print(f"[+] Saved to: {output_path}")
    return combined_df

if __name__ == "__main__":
    download_dataset()
