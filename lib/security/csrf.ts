/**
 * Normalizes a URL's port to its default for the given protocol.
 * Returns the explicit port if set, or 443 for https, 80 for http.
 */
function normalizePort(url: URL): string {
  if (url.port) return url.port;
  return url.protocol === 'https:' ? '443' : '80';
}

/**
 * Validates an incoming request by checking the Origin or Referer header
 * against the configured site URL. Returns a 403 Response on failure, or null
 * when validation succeeds.
 *
 * @param request - The incoming HTTP request to validate.
 * @returns A Response with status 403 if CSRF is detected, or null if the
 *          request passes Origin/Referer validation.
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
