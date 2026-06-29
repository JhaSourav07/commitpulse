import { describe, it, expect } from 'vitest';
import { validateCriticalEnv, assertCriticalEnv } from './validate-env';

// Helper: build a minimal valid env object so tests are self-contained
// and do not accidentally read the real process.env values set by vitest.setup.ts.
function validEnv(overrides: Partial<NodeJS.ProcessEnv> = {}): NodeJS.ProcessEnv {
  return {
    AUTH_SECRET: 'a-super-secret-32-character-dummy!!',
    ENCRYPTION_KEY: 'abcdefghijklmnopqrstuvwxyz012345',
    ...overrides,
  } as NodeJS.ProcessEnv;
}

// ─── validateCriticalEnv ────────────────────────────────────────────────────

describe('validateCriticalEnv — happy path', () => {
  it('returns valid:true and no errors when both keys are present and long enough', () => {
    const result = validateCriticalEnv(validEnv());
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('accepts keys that are exactly 32 characters', () => {
    const result = validateCriticalEnv(
      validEnv({
        AUTH_SECRET: 'exactly-32-characters-long-here!', // 32 chars
        ENCRYPTION_KEY: 'exactly-32-characters-long-here!', // 32 chars
      })
    );
    expect(result.valid).toBe(true);
  });

  it('accepts keys longer than 32 characters', () => {
    const result = validateCriticalEnv(
      validEnv({
        AUTH_SECRET: 'a'.repeat(64),
        ENCRYPTION_KEY: 'b'.repeat(64),
      })
    );
    expect(result.valid).toBe(true);
  });
});

describe('validateCriticalEnv — AUTH_SECRET errors', () => {
  it('returns an error when AUTH_SECRET is missing', () => {
    const result = validateCriticalEnv(validEnv({ AUTH_SECRET: undefined }));
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatch(/AUTH_SECRET/);
    expect(result.errors[0]).toMatch(/openssl rand -base64 32/);
  });

  it('returns an error when AUTH_SECRET is an empty string', () => {
    const result = validateCriticalEnv(validEnv({ AUTH_SECRET: '' }));
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/AUTH_SECRET/);
  });

  it('returns an error when AUTH_SECRET is too short (under 32 chars)', () => {
    const result = validateCriticalEnv(validEnv({ AUTH_SECRET: 'short' }));
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/AUTH_SECRET/);
    // Error message should include the actual length so the developer knows why it failed
    expect(result.errors[0]).toMatch(/5 chars/);
  });

  it('returns an error when AUTH_SECRET is 31 characters (one under the minimum)', () => {
    const result = validateCriticalEnv(validEnv({ AUTH_SECRET: 'a'.repeat(31) }));
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/31 chars/);
  });
});

describe('validateCriticalEnv — ENCRYPTION_KEY errors', () => {
  it('returns an error when ENCRYPTION_KEY is missing', () => {
    const result = validateCriticalEnv(validEnv({ ENCRYPTION_KEY: undefined }));
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatch(/ENCRYPTION_KEY/);
    expect(result.errors[0]).toMatch(/openssl rand -hex 32/);
  });

  it('returns an error when ENCRYPTION_KEY is an empty string', () => {
    const result = validateCriticalEnv(validEnv({ ENCRYPTION_KEY: '' }));
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/ENCRYPTION_KEY/);
  });

  it('returns an error when ENCRYPTION_KEY is too short (under 32 chars)', () => {
    const result = validateCriticalEnv(validEnv({ ENCRYPTION_KEY: 'tiny' }));
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/ENCRYPTION_KEY/);
    expect(result.errors[0]).toMatch(/4 chars/);
  });

  it('returns an error when ENCRYPTION_KEY is 31 characters (one under the minimum)', () => {
    const result = validateCriticalEnv(validEnv({ ENCRYPTION_KEY: 'b'.repeat(31) }));
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/31 chars/);
  });
});

describe('validateCriticalEnv — both keys invalid', () => {
  it('collects errors from both keys independently when both are missing', () => {
    const result = validateCriticalEnv(
      validEnv({ AUTH_SECRET: undefined, ENCRYPTION_KEY: undefined })
    );
    expect(result.valid).toBe(false);
    // Both errors must be reported together so the developer fixes everything in one pass
    expect(result.errors).toHaveLength(2);
    expect(result.errors.some((e) => e.includes('AUTH_SECRET'))).toBe(true);
    expect(result.errors.some((e) => e.includes('ENCRYPTION_KEY'))).toBe(true);
  });

  it('collects errors from both keys when both are too short', () => {
    const result = validateCriticalEnv(
      validEnv({ AUTH_SECRET: 'short', ENCRYPTION_KEY: 'alsoShort' })
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(2);
  });

  it('reports one error and not two when only AUTH_SECRET is missing', () => {
    const result = validateCriticalEnv(validEnv({ AUTH_SECRET: undefined }));
    expect(result.errors).toHaveLength(1);
  });

  it('reports one error and not two when only ENCRYPTION_KEY is missing', () => {
    const result = validateCriticalEnv(validEnv({ ENCRYPTION_KEY: undefined }));
    expect(result.errors).toHaveLength(1);
  });
});

// ─── assertCriticalEnv ──────────────────────────────────────────────────────

describe('assertCriticalEnv — happy path', () => {
  it('does not throw when the environment is fully configured', () => {
    expect(() => assertCriticalEnv(validEnv())).not.toThrow();
  });
});

describe('assertCriticalEnv — throws on bad config', () => {
  it('throws when AUTH_SECRET is missing', () => {
    expect(() => assertCriticalEnv(validEnv({ AUTH_SECRET: undefined }))).toThrow(/AUTH_SECRET/);
  });

  it('throws when ENCRYPTION_KEY is missing', () => {
    expect(() => assertCriticalEnv(validEnv({ ENCRYPTION_KEY: undefined }))).toThrow(
      /ENCRYPTION_KEY/
    );
  });

  it('throws a single consolidated error listing all problems when both keys are missing', () => {
    // A single throw surfaces all issues at once — no "fix one, redeploy, find next error" loop
    expect(() =>
      assertCriticalEnv(validEnv({ AUTH_SECRET: undefined, ENCRYPTION_KEY: undefined }))
    ).toThrow(/AUTH_SECRET/);
    expect(() =>
      assertCriticalEnv(validEnv({ AUTH_SECRET: undefined, ENCRYPTION_KEY: undefined }))
    ).toThrow(/ENCRYPTION_KEY/);
  });

  it('includes setup instructions and .env.local.example reference in the error message', () => {
    let message = '';
    try {
      assertCriticalEnv(validEnv({ AUTH_SECRET: undefined }));
    } catch (err) {
      message = (err as Error).message;
    }
    expect(message).toMatch(/\.env\.local\.example/);
    expect(message).toMatch(/CommitPulse/);
  });

  it('throws an Error instance (not a string or other type)', () => {
    let thrown: unknown;
    try {
      assertCriticalEnv(validEnv({ AUTH_SECRET: undefined }));
    } catch (err) {
      thrown = err;
    }
    expect(thrown).toBeInstanceOf(Error);
  });
});
