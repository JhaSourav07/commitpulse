/**
 * instrumentation.ts — Next.js Server Startup Hook
 *
 * Next.js calls `register()` once when the server process boots, before it
 * accepts any traffic. We use this to validate critical environment variables
 * so that misconfigured deployments fail loudly at startup rather than
 * silently mid-request.
 *
 * Docs: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  // Only run validation on the server side.
  // The `edge` runtime does not have access to process.env in the same way,
  // and client bundles should never import server-only validation logic.
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { assertCriticalEnv } = await import('@/lib/validate-env');
    assertCriticalEnv();
  }
}
