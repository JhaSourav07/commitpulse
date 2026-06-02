const FALLBACK_ORIGIN = 'https://commitpulse.vercel.app';

export function getOrigin(): string {
  const envOrigin = process.env.NEXT_PUBLIC_SITE_URL?.trim() || null;
  return (
    (typeof window !== 'undefined' ? window.location.origin : null) ?? envOrigin ?? FALLBACK_ORIGIN
  );
}

export function getDashboardUrl(username: string): string {
  return `${getOrigin()}/dashboard/${encodeURIComponent(username)}`;
}
