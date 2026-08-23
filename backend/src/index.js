import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import env from './config/env.js';
import logger from './shared/logger.js';
import requestIdMiddleware from './middleware/requestId.js';
import errorHandler from './middleware/errorHandler.js';
import createRateLimiter from './middleware/rateLimit.js';
import authRoutes from './auth/routes.js';
import chatRoutes from './chat/routes.js';
import fileRoutes from './files/routes.js';
import userRoutes from './users/routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Trust proxy for rate limiting and IP detection on reverse proxies (Vercel, Render)
app.set('trust proxy', 1);

// Attach Request ID to every incoming request
app.use(requestIdMiddleware);

// Strict & Safe CORS Setup
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser tools (like curl / Postman) without origin header
    if (!origin) return callback(null, true);

    const isAllowed = allowedOrigins.some((allowed) => origin === allowed || origin.startsWith('http://localhost:'));
    const isVercel = origin.endsWith('.vercel.app') || origin.endsWith('.onrender.com');

    if (isAllowed || isVercel || env.isDevelopment) {
      return callback(null, true);
    }
    logger.warn('CORS', `Blocked request from origin: ${origin}`);
    return callback(new Error(`Origin ${origin} not allowed by CORS policy`), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Requested-With']
}));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Static local uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      app: 'MiniGPT API Server',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      version: '1.0.0'
    }
  });
});

// Rate limiting on sensitive authentication routes (30 requests / 15 mins)
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many authentication attempts. Please try again in 15 minutes.'
});

// Mount modular API routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/users', userRoutes);

// 404 Catch-all handler for undefined API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `API endpoint ${req.method} ${req.originalUrl} not found.`
    }
  });
});

// Global Centralized Error Handler
app.use(errorHandler);

const PORT = env.PORT || 5000;

// Only listen on port in standalone Node runtime (not in Vercel Serverless environment or testing)
if (process.env.VERCEL !== '1' && process.env.NODE_ENV !== 'test') {
  const server = app.listen(PORT, () => {
    logger.info('Server', `🚀 MiniGPT API Server running on port ${PORT}`);
    logger.info('Server', `📡 Health Check: http://localhost:${PORT}/api/health`);
    logger.info('Server', `📋 Mode: ${env.NODE_ENV} | Client: ${env.CLIENT_URL || 'Local'}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      logger.error('Server', `⚠️ Port ${PORT} is already in use! Kill old node process with taskkill /F /IM node.exe`);
      process.exit(1);
    } else {
      logger.error('Server', 'Server startup error:', { error: err.message });
    }
  });
}

export default app;
