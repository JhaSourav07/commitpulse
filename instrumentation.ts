// instrumentation.ts

export async function register() {
  // Ensure this validation only runs on the Node.js server runtime (not Edge)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const authSecret = process.env.AUTH_SECRET;
    const encryptionKey = process.env.ENCRYPTION_KEY;

    // Define insecure fallback values that must be rejected
    const forbiddenFallbacks = [
      'default-fallback-secret-change-me',
      'development-secret-key',
      'change-me-locally',
    ];

    // 1. Validate AUTH_SECRET
    if (!authSecret) {
      throw new Error(
        'CRITICAL: AUTH_SECRET is not configured. The application cannot start without a cryptographic signing key.'
      );
    }

    if (forbiddenFallbacks.includes(authSecret) || authSecret.trim() === '') {
      throw new Error(
        'CRITICAL: AUTH_SECRET is set to an insecure fallback value. Please set a unique, cryptographically strong key.'
      );
    }

    if (authSecret.length < 32) {
      throw new Error(
        'CRITICAL: AUTH_SECRET must be at least 32 characters long to ensure cryptographic integrity.'
      );
    }

    // 2. Validate ENCRYPTION_KEY
    if (!encryptionKey) {
      throw new Error(
        'CRITICAL: ENCRYPTION_KEY is not configured. The application cannot start without an encryption key for third-party tokens.'
      );
    }

    if (forbiddenFallbacks.includes(encryptionKey) || encryptionKey.trim() === '') {
      throw new Error(
        'CRITICAL: ENCRYPTION_KEY is set to an insecure fallback value. Please set a unique, cryptographically strong key.'
      );
    }

    if (encryptionKey.length < 32) {
      throw new Error(
        'CRITICAL: ENCRYPTION_KEY must be at least 32 characters long to ensure secure AES-256-GCM operations.'
      );
    }

    console.log('✓ Environment secrets validated successfully on startup.');
  }
}
