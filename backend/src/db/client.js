import { PrismaClient } from '@prisma/client';
import logger from '../shared/logger.js';

let prismaInstance = null;
let dbConnected = false;

try {
  if (process.env.NODE_ENV === 'production') {
    prismaInstance = new PrismaClient({
      log: ['error', 'warn']
    });
  } else {
    if (!global.prisma) {
      global.prisma = new PrismaClient({
        log: ['error', 'warn']
      });
    }
    prismaInstance = global.prisma;
  }

  // Attempt async connection check on startup
  prismaInstance.$connect()
    .then(() => {
      dbConnected = true;
      logger.info('Database', '✅ Connected to PostgreSQL database with pgvector support');
    })
    .catch((err) => {
      dbConnected = false;
      logger.warn('Database', '⚠️ Database connection not ready on startup:', { error: err.message });
    });
} catch (error) {
  logger.error('Database', 'Prisma Client initialization error:', { error: error.message });
}

export const prisma = prismaInstance || new PrismaClient();
export const isDbConnected = () => dbConnected;
export default prisma;
