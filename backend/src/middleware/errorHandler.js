import logger from '../shared/logger.js';
import env from '../config/env.js';

/**
 * Global Centralized Error Handler Middleware
 */
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.status || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);
  const errorCode = err.code || (statusCode === 404 ? 'NOT_FOUND' : statusCode === 400 ? 'BAD_REQUEST' : statusCode === 401 ? 'UNAUTHORIZED' : statusCode === 403 ? 'FORBIDDEN' : 'INTERNAL_SERVER_ERROR');

  logger.error('ErrorHandler', `${req.method} ${req.originalUrl} - ${err.message}`, {
    statusCode,
    errorCode,
    requestId: req.id,
    stack: err.stack,
    user: req.user?.id
  });

  const response = {
    success: false,
    error: {
      code: errorCode,
      message: err.userMessage || err.message || 'An unexpected internal error occurred.',
      requestId: req.id
    }
  };

  // Only attach dev details if explicitly in development mode and not a 500 in prod
  if (env.isDevelopment && statusCode === 500) {
    response.error.devDetails = {
      name: err.name,
      stack: err.stack
    };
  }

  res.status(statusCode).json(response);
};

export default errorHandler;
