export function errorHandler(err, req, res, next) {
  console.error('[Backend Error]:', err.message || err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    error: {
      message: err.message || 'Internal Server Error',
      status,
      timestamp: new Date().toISOString()
    }
  });
}
