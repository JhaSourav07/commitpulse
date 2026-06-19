type Context = Record<string, unknown>;

const isProduction = process.env.NODE_ENV === 'production';

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
  const payload = {
    level,
    msg,
    timestamp: createTimestamp(),
    ...ctx,
  };

  console.log(JSON.stringify(payload));
}

function logDevelopment(
  level: 'debug' | 'info' | 'warn' | 'error',
  msg: string,
  ctx: Context = {}
): void {
  const color = COLORS[level];
  const contextString = Object.keys(ctx).length > 0 ? ` ${JSON.stringify(ctx)}` : '';

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
