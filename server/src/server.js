import app from './app.js';

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`[Express Server] Weather API running on http://localhost:${PORT}`);
  console.log(`[Express Server] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[Express Server] ML Service configured at: ${process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000'}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
