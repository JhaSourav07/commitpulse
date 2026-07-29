/**
 * Normalises the port from a URL object.
 *
 * Returns the explicit port if set, otherwise infers the default port
 * from the URL protocol (443 for https:, 80 for http:).
 *
 * @param url - A parsed URL object
 * @returns The port number as a string
 */
function normalizePort(url: URL): string {
  if (url.port) return url.port;
  return url.protocol === 'https:' ? '443' : '80';
}

/**
 * Validates a server-side request against CSRF attacks by checking the Origin or
 * Referer header matches the configured site URL.
 *
 * Both Origin and Referer are checked; at least one must be present and
 * match the allowed origin for the request to pass.
 *
 * @param request - The incoming server request
 * @returns `null` when the request is valid, or a 403 Response when CSRF is detected
 */
export function validateCSRF(request: Request): Response | null {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  const allowedOrigin = process.env.NEXT_PUBLIC_SITE_URL || 'https://commitpulse.vercel.app';

  // Require either Origin or Referer header for CSRF protection
  if (!origin && !referer) {
    return new Response(JSON.stringify({ error: 'Missing Origin or Referer header' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const isValidOrigin = (value: string | null) => {
    if (!value) return false;

    try {
      const url = new URL(value);
      const allowed = new URL(allowedOrigin);

      return (
        url.protocol === allowed.protocol &&
        url.hostname === allowed.hostname &&
        normalizePort(url) === normalizePort(allowed)
      );
    } catch {
      return false;
    }
  };

  const isValid = isValidOrigin(origin) || isValidOrigin(referer);

  if (!isValid) {
    return new Response(JSON.stringify({ error: 'CSRF validation failed' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return null;
}
