import express from 'express';
import cors from 'cors';
import path from 'path'
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


const filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(filename);

const app = express();

app.set('trust proxy', 1);

app.use(requestIdMiddleware);


const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://miniakashagent.vercel.app',
  env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests without an Origin header
    if (!origin) {
      return callback(null, true);
    }

    const isAllowed =
      allowedOrigins.includes(origin) ||
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:') ||
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.onrender.com');

    if (isAllowed || env.isDevelopment) {
      return callback(null, true);
    }

    logger.warn('CORS', `Blocked request from origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },

  credentials: true,

  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],

  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Request-ID',
    'X-Requested-With'
  ]
}));


app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: "System is running",
    timestamp: new Date().toISOString()
  })
});

const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many requests. Please try again after 15 minutes.'
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/user', userRoutes);

app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `API endpoint ${req.method} ${req.originalUrl} not found.`
    }
  });
})

app.use(errorHandler);

const PORT = env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
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

