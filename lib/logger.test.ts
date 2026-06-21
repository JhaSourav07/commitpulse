import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('logger', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();

    process.env = {
      ...OLD_ENV,
    };
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it('debug is silent in production', async () => {
    process.env = {
      ...process.env,
      NODE_ENV: 'production',
    };

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const logger = (await import('./logger')).default;

    logger.debug('debug message');

    expect(logSpy).not.toHaveBeenCalled();
  });

  it('info is silent in production', async () => {
    process.env = {
      ...process.env,
      NODE_ENV: 'production',
    };

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const logger = (await import('./logger')).default;

    logger.info('info message');

    expect(logSpy).not.toHaveBeenCalled();
  });

  it('error always emits in production', async () => {
    process.env = {
      ...process.env,
      NODE_ENV: 'production',
    };

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const logger = (await import('./logger')).default;

    logger.error('something failed');

    expect(logSpy).toHaveBeenCalledTimes(1);
  });

  it('production output is valid JSON', async () => {
    process.env = {
      ...process.env,
      NODE_ENV: 'production',
    };

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const logger = (await import('./logger')).default;

    logger.error('json test', {
      route: '/api/test',
    });

    expect(logSpy).toHaveBeenCalledTimes(1);

    const output = logSpy.mock.calls[0][0] as string;

    const parsed = JSON.parse(output);

    expect(parsed.level).toBe('error');
    expect(parsed.msg).toBe('json test');
    expect(parsed.route).toBe('/api/test');
    expect(parsed.timestamp).toBeDefined();
  });

  // ─── NEW SECURITY REDACTION TEST ───────────────────────────────────────────
  it('redacts sensitive fields in production logs', async () => {
    process.env = {
      ...process.env,
      NODE_ENV: 'production',
    };

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const logger = (await import('./logger')).default;

    logger.error('sensitive data leak test', {
      password: 'super_secret_password',
      email: 'user@domain.com',
      nested: {
        token: 'secret_token_123',
        safeField: 'cleartext',
      },
    });

    const output = logSpy.mock.calls[0][0] as string;
    const parsed = JSON.parse(output);

    // Verify sensitive keys are safely masked
    expect(parsed.password).toBe('[REDACTED]');
    expect(parsed.email).toBe('[REDACTED]');
    expect(parsed.nested.token).toBe('[REDACTED]');

    // Verify non-sensitive keys pass through untouched
    expect(parsed.nested.safeField).toBe('cleartext');
  });
});
