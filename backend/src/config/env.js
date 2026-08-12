import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Search multiple locations for .env
const possiblePaths = [
  path.resolve(__dirname, '../../.env'),                          // backend/.env
  path.resolve(__dirname, '../../../.env'),                       // root .env
  path.resolve(process.cwd(), '.env'),                            // cwd/.env
  path.resolve(process.cwd(), 'backend/.env'),                   // cwd/backend/.env
];

let envLoaded = false;
for (const envPath of possiblePaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log(`✅ Loaded .env from: ${envPath}`);
    envLoaded = true;
    break;
  }
}

if (!envLoaded) {
  console.warn('⚠️ No .env file found in any expected location');
  console.warn('   Searched:', possiblePaths);
}

// Also try cwd as fallback
dotenv.config();

// Validate critical keys on startup
const criticalKeys = ['GEMINI_API_KEY', 'OPENAI_API_KEY', 'MISTRAL_API_KEY', 'DATABASE_URL'];
for (const key of criticalKeys) {
  if (process.env[key]) {
    const val = process.env[key];
    const masked = val.length > 10 ? val.substring(0, 6) + '...' + val.substring(val.length - 4) : '******';
    console.log(`   ${key}: ${masked}`);
  } else {
    console.warn(`   ⚠️ ${key}: NOT SET`);
  }
}

export const env = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  SERVER_URL: process.env.SERVER_URL || 'http://localhost:5000',
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || 'minigpt_dev_jwt_secret_key_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  MISTRAL_API_KEY: process.env.MISTRAL_API_KEY || '',
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
  AWS_REGION: process.env.AWS_REGION || 'us-east-1',
  AWS_S3_BUCKET: process.env.AWS_S3_BUCKET || 'minigpt-files',
  SERPAPI_KEY: process.env.SERPAPI_KEY || '',
  OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY || ''
};

export default env;
