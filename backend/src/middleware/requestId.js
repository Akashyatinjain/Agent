import crypto from 'crypto';

/**
 * Request ID Middleware
 * Attaches a unique X-Request-ID to every request and response header
 */
export const requestIdMiddleware = (req, res, next) => {
  const incomingId = req.headers['x-request-id'];
  const reqId = incomingId || crypto.randomUUID();
  req.id = reqId;
  res.setHeader('X-Request-ID', reqId);
  next();
};

export default requestIdMiddleware;
