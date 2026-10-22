import * as geocodingService from '../services/geocoding.service.js';
import * as openMeteoService from '../services/openmeteo.service.js';
import * as mlService from '../services/ml.service.js';

export async function searchCitiesHandler(req, res, next) {
  try {
    const query = req.query.q || req.query.name;
    if (!query) {
      return res.status(400).json({ success: false, error: 'Query parameter "q" is required' });
    }
    const results = await geocodingService.searchCities(query);
    return res.json({ success: true, count: results.length, data: results });
  } catch (error) {
    next(error);
  }
}

export async function getForecastHandler(req, res, next) {
  try {
    let { city, lat, lon, elevation } = req.query;
    let locationMeta = {
      name: city || 'Custom Location',
      country: '',
      formattedName: city || 'Custom Location',
      latitude: parseFloat(lat),
      longitude: parseFloat(lon),
      elevation: parseFloat(elevation) || 20.0
    };

    // If city name is provided without coordinates, geocode first
    if (city && (isNaN(locationMeta.latitude) || isNaN(locationMeta.longitude))) {
      const cities = await geocodingService.searchCities(city, 1);
      if (!cities || cities.length === 0) {
        return res.status(404).json({
          success: false,
          error: `City "${city}" could not be located.`
        });
      }
      const matched = cities[0];
      locationMeta = {
        name: matched.name,
        country: matched.country,
        countryCode: matched.countryCode,
        admin1: matched.admin1,
        formattedName: matched.formattedName,
        latitude: matched.latitude,
        longitude: matched.longitude,
        elevation: matched.elevation
      };
    }

    if (isNaN(locationMeta.latitude) || isNaN(locationMeta.longitude)) {
      return res.status(400).json({
        success: false,
        error: 'Valid city name or latitude and longitude parameters are required.'
      });
    }

    // 1. Fetch live observational data & past 24-48h history from Open-Meteo
    const weatherData = await openMeteoService.fetchLiveAndHistoricalWeather(
      locationMeta.latitude,
      locationMeta.longitude
    );

    // 2. Prepare payload for Python ML Inference Server
    const mlPayload = {
      city_name: locationMeta.formattedName,
      latitude: locationMeta.latitude,
      longitude: locationMeta.longitude,
      elevation: weatherData.elevation || locationMeta.elevation || 20.0,
      current: weatherData.current,
      history: weatherData.history
    };

    // 3. Request ML predictions in parallel
    const [mlNextHour, ml24hForecast] = await Promise.all([
      mlService.predictWithML(mlPayload),
      mlService.forecast24hWithML(mlPayload)
    ]);

    // 4. Construct 3D scene configuration based on forecast & time of day
    const isDay = weatherData.current.is_day;
    const rainProb = mlNextHour.rain_probability;
    const conditionMain = mlNextHour.condition.main;

    const scene3D = {
      theme: mlNextHour.condition.theme,
      isDay,
      condition: conditionMain,
      clouds: {
        density: conditionMain.includes('Overcast') ? 0.9 : conditionMain.includes('Cloud') ? 0.6 : 0.2,
        speed: Math.max(0.2, (mlNextHour.wind_speed_kmh / 30.0))
      },
      rain: {
        active: mlNextHour.rain_yes_no || rainProb > 35,
        intensity: rainProb >= 70 ? 1.0 : rainProb >= 40 ? 0.5 : 0.0
      },
      snow: {
        active: conditionMain === 'Snow'
      },
      sun: {
        visible: isDay,
        intensity: isDay ? (conditionMain.includes('Clear') ? 1.5 : 0.7) : 0.1
      },
      lightning: {
        active: conditionMain === 'Thunderstorm'
      }
    };

    return res.json({
      success: true,
      data: {
        location: locationMeta,
        live_current: weatherData.current,
        ml_forecast: mlNextHour,
        hourly_forecast: ml24hForecast.forecast_hours,
        scene_3d: scene3D,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getModelMetricsHandler(req, res, next) {
  try {
    const metrics = await mlService.getMLMetrics();
    if (!metrics) {
      return res.status(503).json({
        success: false,
        error: 'ML metrics currently unavailable from Python microservice'
      });
    }
    return res.json({ success: true, data: metrics });
  } catch (error) {
    next(error);
  }
}

export async function getHealthHandler(req, res, next) {
  try {
    const mlHealth = await mlService.checkMLServiceHealth();
    return res.json({
      success: true,
      server: {
        status: 'online',
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
      },
      ml_service: mlHealth
    });
  } catch (error) {
    next(error);
  }
}
