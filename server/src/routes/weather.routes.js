import express from 'express';
import {
  searchCitiesHandler,
  getForecastHandler,
  getModelMetricsHandler,
  getHealthHandler
} from '../controllers/weather.controller.js';
import { cacheMiddleware } from '../middleware/cache.js';

const router = express.Router();

// Search cities (cached for 10 minutes)
router.get('/search', cacheMiddleware(600), searchCitiesHandler);

// Weather Forecast powered by ML (cached for 3 minutes)
router.get('/forecast', cacheMiddleware(180), getForecastHandler);

// Model training metrics & evaluation benchmarks
router.get('/metrics', cacheMiddleware(3600), getModelMetricsHandler);

// Health check
router.get('/health', getHealthHandler);

export default router;
