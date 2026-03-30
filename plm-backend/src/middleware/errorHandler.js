const winston = require('winston');
const env = require('../config/env');

const logger = winston.createLogger({
  level: 'error',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
  ],
});

/**
 * Global error handler middleware.
 * Catches all unhandled errors, logs them, and returns structured response.
 */
function errorHandler(err, req, res, _next) {
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
  });

  // Handle PostgreSQL constraint errors
  if (err.code === '23505') {
    // Unique violation
    return res.status(409).json({
      success: false,
      message: 'A record with the given value already exists.',
    });
  }

  if (err.code === '23503') {
    // Foreign key violation
    return res.status(400).json({
      success: false,
      message: 'Referenced record does not exist.',
    });
  }

  const statusCode = err.statusCode || 500;
  const response = {
    success: false,
    message: err.message || 'Internal server error',
  };

  if (env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  return res.status(statusCode).json(response);
}

module.exports = errorHandler;
