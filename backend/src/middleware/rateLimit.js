/**
 * Memory-based Sliding Window Rate Limiter Middleware
 */

const rateLimitStore = new Map();

// Periodic cleanup of stale rate-limit buckets every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000).unref();

export const createRateLimiter = ({
  windowMs = 60 * 1000,
  max = 60,
  message = 'Too many requests, please try again later.'
} = {}) => {
  return (req, res, next) => {
    const key = req.user?.id || req.ip || req.headers['x-forwarded-for'] || 'anonymous';
    const now = Date.now();

    let record = rateLimitStore.get(key);
    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs
      };
      rateLimitStore.set(key, record);
      return next();
    }

    record.count += 1;
    if (record.count > max) {
      const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSec);
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message,
          retryAfter: retryAfterSec
        }
      });
    }

    next();
  };
};

export default createRateLimiter;
