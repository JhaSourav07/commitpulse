import { headers } from 'next/headers';

/**
 * Retrieves the `x-request-id` header value from the current request.
 * Useful for correlating server-side logs with client-side error reports.
 *
 * @returns The request ID string, or null if the header is absent.
 */
export async function getRequestId(): Promise<string | null> {
  const h = await headers();
  return h.get('x-request-id');
}
