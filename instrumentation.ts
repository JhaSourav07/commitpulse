/**
 * Next.js Instrumentation Hook
 *
 * This file is automatically executed once when the Next.js server starts,
 * making it perfect for startup validation and initialization tasks.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

import { enforceEnvironmentValidation } from './lib/env-validation';

/**
 * Called once when the Node.js server starts.
 * Perfect for:
 * - Environment validation
 * - Database connection checks
 * - Telemetry setup
 * - Feature flag initialization
 */
export async function register() {
  // Skip in Edge runtime (Edge doesn't support all Node.js APIs)
  if (process.env.NEXT_RUNTIME === 'edge') {
    return;
  }

  console.log('🚀 Initializing CommitPulse server...');

  try {
    // Validate environment variables at startup
    // This will throw if required variables are missing
    enforceEnvironmentValidation();

    console.log('✅ Environment validation passed');
    console.log('✅ Server initialization complete\n');
  } catch (error) {
    console.error('❌ Server initialization failed:', error);
    
    // In production, we want to fail fast
    // In development, we let it continue but with clear warnings
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
  }
}

/**
 * Called when running at the Edge runtime.
 * Currently not used, but available for edge-specific initialization.
 */
export function onRequestError() {
  // Optional: Add error tracking here (e.g., Sentry, DataDog)
}
