type Context = Record<string, unknown>;

const isProduction = process.env.NODE_ENV === 'production';

// Define sensitive keys that should be masked
const SENSITIVE_KEYS = ['token', 'key', 'secret', 'password', 'authorization', 'cookie', 'email'];

/**
 * Recursively scans and redacts sensitive information from an object.
 */
function redact(obj: Context): Context {
  const result: Context = {};

  for (const [key, value] of Object.entries(obj)) {
    // Check if the current key contains any of our sensitive keywords
    if (SENSITIVE_KEYS.some((k) => key.toLowerCase().includes(k))) {
      result[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      // Recursively redact nested objects
      result[key] = redact(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }

  return result;
}

const COLORS = {
  debug: '\x1b[36m', // Cyan
  info: '\x1b[32m', // Green
  warn: '\x1b[33m', // Yellow
  error: '\x1b[31m', // Red
  reset: '\x1b[0m',
};

function createTimestamp(): string {
  return new Date().toISOString();
}

function logProduction(level: 'warn' | 'error', msg: string, ctx: Context = {}): void {
  // Redact sensitive fields before structure serialization
  const redactedCtx = redact(ctx);

  const payload = {
    level,
    msg,
    timestamp: createTimestamp(),
    ...redactedCtx,
  };

  console.log(JSON.stringify(payload));
}

function logDevelopment(
  level: 'debug' | 'info' | 'warn' | 'error',
  msg: string,
  ctx: Context = {}
): void {
  const color = COLORS[level];

  // Also redact in development to prevent accidental terminal exposure
  const redactedCtx = redact(ctx);
  const contextString =
    Object.keys(redactedCtx).length > 0 ? ` ${JSON.stringify(redactedCtx)}` : '';

  const output = `${color}[${level.toUpperCase()}]${COLORS.reset} ${msg}${contextString}`;

  if (level === 'error') {
    console.error(output);
  } else if (level === 'warn') {
    console.warn(output);
  } else {
    console.log(output);
  }
}

export const logger = {
  debug(msg: string, ctx?: Context): void {
    if (isProduction) return;
    logDevelopment('debug', msg, ctx);
  },

  info(msg: string, ctx?: Context): void {
    if (isProduction) return;
    logDevelopment('info', msg, ctx);
  },

  warn(msg: string, ctx?: Context): void {
    if (isProduction) {
      logProduction('warn', msg, ctx);
      return;
    }

    logDevelopment('warn', msg, ctx);
  },

  error(msg: string, ctx?: Context): void {
    if (isProduction) {
      logProduction('error', msg, ctx);
      return;
    }

    logDevelopment('error', msg, ctx);
  },
};

export default logger;
