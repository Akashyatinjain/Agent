import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import env from './config/env.js';
import errorHandler from './middleware/errorHandler.js';
import authRoutes from './auth/routes.js';
import chatRoutes from './chat/routes.js';
import fileRoutes from './files/routes.js';
import userRoutes from './users/routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS Configuration for Render + Vercel Deployment
app.use(cors({
  origin: (origin, callback) => {
    // Allow request if no origin (mobile/curl) or if from Vercel / localhost
    if (!origin || origin.includes('vercel.app') || origin.includes('localhost') || origin.includes('127.0.0.1') || (env.CLIENT_URL && origin === env.CLIENT_URL)) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Serve Local File Uploads Directory statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'MiniGPT API Server',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/users', userRoutes);

// Error Handling Middleware
app.use(errorHandler);

const PORT = env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 MiniGPT API Server running on port ${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`📁 Local Storage Directory: http://localhost:${PORT}/uploads`);
  
  // Log configuration status
  console.log('\n📋 Configuration Status:');
  console.log(`   Environment: ${env.NODE_ENV}`);
  console.log(`   Client URL: ${env.CLIENT_URL || 'Not set'}`);
  console.log(`   Database: ${env.DATABASE_URL ? 'Configured' : '⚠️ NOT SET'}`);
  console.log(`   Gemini API: ${env.GEMINI_API_KEY ? (env.GEMINI_API_KEY.startsWith('AIzaSy') ? '✅ Valid format' : '⚠️ Invalid format (should start with AIzaSy)') : '⚠️ NOT SET'}`);
  console.log(`   OpenAI API: ${env.OPENAI_API_KEY ? (env.OPENAI_API_KEY.startsWith('sk-') ? '✅ Valid format' : '⚠️ Invalid format (should start with sk-)') : '⚠️ NOT SET'}`);
  console.log('');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`⚠️ Port ${PORT} is already in use! Kill old node process with: taskkill /F /IM node.exe`);
    process.exit(1);
  } else {
    console.error('❌ Server error:', err);
  }
});

export default app;
