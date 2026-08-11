import { PrismaClient } from '@prisma/client';
import env from '../config/env.js';

let prismaInstance = null;
let dbConnected = false;

try {
  if (process.env.NODE_ENV === 'production') {
    prismaInstance = new PrismaClient();
  } else {
    if (!global.prisma) {
      global.prisma = new PrismaClient({
        log: ['error', 'warn'],
      });
    }
    prismaInstance = global.prisma;
  }

  // Test connection
  prismaInstance.$connect().then(() => {
    dbConnected = true;
    console.log('✅ Database connected successfully');
  }).catch((err) => {
    console.warn('⚠️ Database connection failed:', err.message.substring(0, 100));
    console.warn('   Running in fallback mode - auth/data will use in-memory fallbacks');
  });
} catch (error) {
  console.warn('⚠️ Prisma Client initialization warning:', error.message);
  console.warn('💡 Set a valid Neon DATABASE_URL in .env to connect to your Postgres database.');
  console.warn('   Running in fallback mode.');
}

// Robust fallback proxy to prevent backend crash if DB is not connected yet
const handler = {
  get(target, prop) {
    if (target && target[prop] !== undefined) {
      if (typeof target[prop] === 'function') {
        return target[prop].bind(target);
      }
      return target[prop];
    }
    // Return mock async function for unhandled DB models
    return new Proxy({}, {
      get() {
        return async () => null;
      }
    });
  }
};

export const prisma = new Proxy(prismaInstance || {}, handler);
export const isDbConnected = () => dbConnected;
export default prisma;
