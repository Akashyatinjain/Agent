import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import logger from '../shared/logger.js';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication token required. Please log in.'
      }
    });
  }

  jwt.verify(token, env.JWT_SECRET, (err, user) => {
    if (err) {
      logger.warn('AuthMiddleware', 'Invalid or expired token supplied', { error: err.name, requestId: req.id });
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_INVALID_OR_EXPIRED',
          message: err.name === 'TokenExpiredError' 
            ? 'Session expired. Please log in again.' 
            : 'Invalid authentication token.'
        }
      });
    }

    req.user = user;
    next();
  });
};

export default authenticateToken;
