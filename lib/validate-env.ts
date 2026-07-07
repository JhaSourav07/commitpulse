/**
 * validate-env.ts
 *
 * Validates that critical server-side environment variables are present and
 * meet minimum security requirements. Call this once at server startup so
 * misconfigured deployments fail loudly at boot — not silently mid-request.
 *
 * Required variables:
 *   AUTH_SECRET      — NextAuth.js JWT signing key (≥ 32 chars)
 *   ENCRYPTION_KEY   — AES-256 token encryption key (≥ 32 chars)
 */

export interface EnvValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates the critical environment variables needed for authentication and
 * encryption. Returns a result object rather than throwing so callers can
 * decide how to surface errors (log, throw, render an error page, etc.).
 */
export function validateCriticalEnv(env: NodeJS.ProcessEnv = process.env): EnvValidationResult {
  const errors: string[] = [];

  // AUTH_SECRET: required by NextAuth.js to sign JWT session cookies.
  // Without it, NextAuth falls back to an insecure default or throws at runtime,
  // and every server restart invalidates all existing user sessions.
  const authSecret = env.AUTH_SECRET;
  if (!authSecret) {
    errors.push(
      'AUTH_SECRET is not set. ' +
        'Generate one with: openssl rand -base64 32 ' +
        'and add it to your .env.local and deployment environment.'
    );
  } else if (authSecret.length < 32) {
    errors.push(
      `AUTH_SECRET is too short (${authSecret.length} chars). ` +
        'It must be at least 32 characters to provide sufficient entropy for JWT signing.'
    );
  }

  // ENCRYPTION_KEY: required by lib/crypto.ts (AES-256-GCM) to encrypt and
  // decrypt GitHub OAuth tokens stored in the database. Without it, token
  // persistence fails and users see "not authenticated" despite valid sessions.
  const encryptionKey = env.ENCRYPTION_KEY;
  if (!encryptionKey) {
    errors.push(
      'ENCRYPTION_KEY is not set. ' +
        'Generate one with: openssl rand -hex 32 ' +
        'and add it to your .env.local and deployment environment.'
    );
  } else if (encryptionKey.length < 32) {
    errors.push(
      `ENCRYPTION_KEY is too short (${encryptionKey.length} chars). ` +
        'It must be at least 32 characters to satisfy AES-256 key derivation requirements.'
    );
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates critical environment variables and throws a single consolidated
 * Error if any are missing or invalid. Intended for use in server startup
 * hooks (e.g. Next.js instrumentation.ts) where a thrown error will prevent
 * the server from accepting traffic in a misconfigured state.
 */
export function assertCriticalEnv(env: NodeJS.ProcessEnv = process.env): void {
  const result = validateCriticalEnv(env);
  if (!result.valid) {
    throw new Error(
      '[CommitPulse] Server startup aborted — missing or invalid environment variables:\n' +
        result.errors.map((e) => `  • ${e}`).join('\n') +
        '\n\nSee .env.local.example for setup instructions.'
    );
  }
}
