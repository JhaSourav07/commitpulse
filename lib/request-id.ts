/**
 * Cross-cutting HTTP request tracing utilities for CommitPulse.
 *
 * Provides lightweight request identification by reading the `x-request-id` header
 * from incoming requests. Request IDs are typically injected by a load balancer or
 * API gateway and allow operators to correlate logs and traces across services.
 *
 * This module is server-side only (`headers()` is a Next.js server runtime API)
 * and must not be imported in client components.
 *
 * @module
 */

/**
 * Extracts the `x-request-id` header value from the current incoming request.
 *
 * Reads the `x-request-id` HTTP header which is typically set by upstream proxies,
 * load balancers, or API gateways. If the header is absent, returns `null`.
 *
 * @returns A Promise resolving to the `x-request-id` header value, or `null`
 *   if the header is not present in the request.
 *
 * @remarks
 * This function is async because `headers()` in Next.js App Router is an
 * asynchronous call that reads the request headers at the edge. This differs
 * from `req.headers` in Pages Router which was synchronous.
 *
 * The presence of the header is not guaranteed — operators must configure their
 * infrastructure (e.g. Nginx `proxy_set_header X-Request-Id $request_id`, or a
 * Vercel/Cloudflare proxy rule) to propagate request IDs.
 *
 * @example
 * ```ts
 * const requestId = await getRequestId();
 * logger.info('Processing request', { requestId });
 * // If requestId is null, fall back to generating an internal UUID
 * const id = requestId ?? crypto.randomUUID();
 * ```
 *
 * @example
 * ```ts
 * // Using in an API route
 * export async function GET(req: Request) {
 *   const rid = await getRequestId();
 *   return NextResponse.json({ ok: true, requestId: rid });
 * }
 * ```
 */
export async function getRequestId() {
  const h = await headers();
  return h.get('x-request-id');
}
