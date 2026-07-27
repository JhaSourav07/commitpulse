/**
 * Retrieves the `x-request-id` header value from the current incoming server request.
 * This header is typically set by the hosting platform (e.g., Vercel) or an upstream
 * proxy to enable request tracing and log correlation.
 *
 * @returns The request ID string if present, or null if the header is absent.
 * @example
 * ```ts
 * const requestId = await getRequestId();
 * console.log(requestId); // "req_abc123xyz"
 * ```
 */
export async function getRequestId() {
  const h = await headers();
  return h.get('x-request-id');
}
