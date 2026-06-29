export function validateCSRF(request: Request): Response | null {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  const allowedOrigin = process.env.NEXT_PUBLIC_SITE_URL || 'https://commitpulse.vercel.app';

  // Allow server-to-server / tests
  if (!origin && !referer) return null;

  const isValidOrigin = (value: string | null) => {
    if (!value) return false;

    try {
      const url = new URL(value);
      const allowed = new URL(allowedOrigin);

      return url.protocol === allowed.protocol && url.hostname === allowed.hostname;
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
