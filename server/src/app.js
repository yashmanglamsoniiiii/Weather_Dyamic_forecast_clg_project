import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import weatherRoutes from './routes/weather.routes.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting to all /api routes
app.use('/api', apiLimiter);

// Routes
app.use('/api/weather', weatherRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Weather Forecast ML API',
    version: '1.0.0',
    description: 'Node.js Express backend integrating Python ML microservice and Open-Meteo',
    endpoints: {
      search: '/api/weather/search?q=London',
      forecast: '/api/weather/forecast?city=London',
      metrics: '/api/weather/metrics',
      health: '/api/weather/health'
    }
  });
});

// Centralized error handling
app.use(errorHandler);

export default app;
