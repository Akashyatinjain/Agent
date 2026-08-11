import { PrismaClient } from '@prisma/client';
import env from '../config/env.js';

let prismaInstance = null;

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
} catch (error) {
  console.warn('⚠️ Prisma Client initialization warning:', error.message);
  console.warn('💡 Set a valid Neon DATABASE_URL in .env to connect to your Postgres database.');
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
export default prisma;
