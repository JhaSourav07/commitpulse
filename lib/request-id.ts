import { headers } from 'next/headers';

/**
 * Retrieves the `x-request-id` header value from the current incoming request.
 *
 * The header is typically set by a reverse proxy or the hosting platform
 * (e.g. Vercel, Cloudflare) to enable distributed tracing and log correlation.
 * When the header is absent the function returns `null`.
 *
 * This function is async because `next/headers` `headers()` must be awaited
 * inside an async server component or route handler.
 *
 * @returns The request ID string from the `x-request-id` header, or `null`
 *   if the header is not present in the incoming request.
 *
 * @example
 * // In a server component or route handler:
 * const requestId = await getRequestId();
 * if (requestId) {
 *   logger.info({ requestId }, 'Handling request');
 * }
 */
export async function getRequestId(): Promise<string | null> {
  const h = await headers();
  return h.get('x-request-id');
}
