/**
 * Structured Logger for MiniGPT Backend
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

const currentLevel = process.env.LOG_LEVEL 
  ? LOG_LEVELS[process.env.LOG_LEVEL.toUpperCase()] ?? LOG_LEVELS.INFO
  : LOG_LEVELS.INFO;

const sanitize = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const clone = Array.isArray(obj) ? [...obj] : { ...obj };
  const sensitiveKeys = ['password', 'passwordHash', 'token', 'jwt', 'apiKey', 'secret', 'authorization'];
  
  for (const key of Object.keys(clone)) {
    if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
      clone[key] = '***REDACTED***';
    } else if (typeof clone[key] === 'object') {
      clone[key] = sanitize(clone[key]);
    }
  }
  return clone;
};

const formatMessage = (level, component, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  const sanitizedMeta = sanitize(meta);
  return {
    timestamp,
    level,
    component: component || 'App',
    message,
    ...(Object.keys(sanitizedMeta).length > 0 ? { meta: sanitizedMeta } : {})
  };
};

export const logger = {
  debug: (component, message, meta) => {
    if (currentLevel <= LOG_LEVELS.DEBUG) {
      console.debug(JSON.stringify(formatMessage('DEBUG', component, message, meta)));
    }
  },
  info: (component, message, meta) => {
    if (currentLevel <= LOG_LEVELS.INFO) {
      const entry = formatMessage('INFO', component, message, meta);
      console.log(`[${entry.timestamp}] [INFO] [${entry.component}] ${message}`, meta ? JSON.stringify(sanitize(meta)) : '');
    }
  },
  warn: (component, message, meta) => {
    if (currentLevel <= LOG_LEVELS.WARN) {
      const entry = formatMessage('WARN', component, message, meta);
      console.warn(`[${entry.timestamp}] [WARN] [${entry.component}] ${message}`, meta ? JSON.stringify(sanitize(meta)) : '');
    }
  },
  error: (component, message, meta) => {
    if (currentLevel <= LOG_LEVELS.ERROR) {
      const entry = formatMessage('ERROR', component, message, meta);
      console.error(`[${entry.timestamp}] [ERROR] [${entry.component}] ${message}`, meta ? JSON.stringify(sanitize(meta)) : '');
    }
  }
};

export default logger;
