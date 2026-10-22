import axios from 'axios';

const OPENMETEO_URL = process.env.OPENMETEO_API_URL || 'https://api.open-meteo.com/v1';

export async function fetchLiveAndHistoricalWeather(latitude, longitude) {
  try {
    const response = await axios.get(`${OPENMETEO_URL}/forecast`, {
      params: {
        latitude,
        longitude,
        current: [
          'temperature_2m',
          'relative_humidity_2m',
          'apparent_temperature',
          'is_day',
          'precipitation',
          'rain',
          'surface_pressure',
          'cloud_cover',
          'wind_speed_10m',
          'wind_direction_10m'
        ].join(','),
        hourly: [
          'temperature_2m',
          'relative_humidity_2m',
          'dew_point_2m',
          'surface_pressure',
          'cloud_cover',
          'wind_speed_10m',
          'precipitation',
          'rain'
        ].join(','),
        past_days: 2,
        forecast_days: 3,
        timezone: 'auto'
      },
      timeout: 10000
    });

    const data = response.data;
    const current = data.current || {};
    const hourly = data.hourly || {};

    // Build array of recent past observations (last 24 to 48 hours)
    const history = [];
    if (hourly.time && Array.isArray(hourly.time)) {
      const currentTimeStr = current.time;
      const currentIndex = hourly.time.findIndex((t) => t >= currentTimeStr);
      const splitIdx = currentIndex >= 0 ? currentIndex : hourly.time.length;

      // Extract up to 24 previous hours
      const startIdx = Math.max(0, splitIdx - 24);
      for (let i = startIdx; i < splitIdx; i++) {
        history.push({
          time: hourly.time[i],
          temperature_2m: hourly.temperature_2m?.[i] ?? 20.0,
          relative_humidity_2m: hourly.relative_humidity_2m?.[i] ?? 60.0,
          dew_point_2m: hourly.dew_point_2m?.[i] ?? (hourly.temperature_2m?.[i] - 5),
          surface_pressure: hourly.surface_pressure?.[i] ?? 1013.25,
          cloud_cover: hourly.cloud_cover?.[i] ?? 20.0,
          wind_speed_10m: hourly.wind_speed_10m?.[i] ?? 10.0,
          rain: hourly.rain?.[i] ?? 0.0
        });
      }
    }

    return {
      current: {
        time: current.time,
        temperature_2m: current.temperature_2m,
        relative_humidity_2m: current.relative_humidity_2m,
        apparent_temperature: current.apparent_temperature,
        is_day: Boolean(current.is_day),
        surface_pressure: current.surface_pressure,
        cloud_cover: current.cloud_cover,
        wind_speed_10m: current.wind_speed_10m,
        wind_direction_10m: current.wind_direction_10m,
        rain: current.rain ?? current.precipitation ?? 0.0
      },
      history,
      elevation: data.elevation,
      timezone: data.timezone,
      utc_offset_seconds: data.utc_offset_seconds
    };
  } catch (error) {
    console.error('[Open-Meteo Service Error]:', error.message);
    throw new Error(`Failed to fetch weather from Open-Meteo: ${error.message}`);
  }
}
