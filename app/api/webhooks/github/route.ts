import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { cacheKey, contributionsCache } from '@/lib/github';

/**
 * GitHub push webhook: invalidates the cached contribution data for the
 * pushing user so their badge reflects the new commit immediately instead
 * of waiting for the cache TTL to expire.
 *
 * Configure the webhook on GitHub with content type application/json,
 * the push event, and the shared secret from GITHUB_WEBHOOK_SECRET.
 */

const MAX_PAYLOAD_SIZE = 1024 * 1024; // 1MB
const SIGNATURE_PREFIX = 'sha256=';
// One webhook-triggered revalidation per username per minute; a busy
// repository can emit many push events in quick succession and each
// revalidation costs a GitHub API round trip.
const REVALIDATE_LIMIT = 1;
const REVALIDATE_WINDOW_MS = 60_000;

function getWebhookSecret(): string | null {
  const secret = process.env.GITHUB_WEBHOOK_SECRET?.trim();
  return secret || null;
}

function verifySignature(bodyText: string, signature: string, secret: string): boolean {
  if (!signature.startsWith(SIGNATURE_PREFIX)) {
    return false;
  }
  const signatureHex = signature.slice(SIGNATURE_PREFIX.length);
  if (!/^[a-f0-9]{64}$/i.test(signatureHex)) {
    return false;
  }
  const expected = Buffer.from(
    crypto.createHmac('sha256', secret).update(bodyText).digest('hex'),
    'hex'
  );
  const received = Buffer.from(signatureHex, 'hex');
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}

/** Usernames follow GitHub's rules: alphanumerics and inner hyphens, max 39 chars. */
function isValidUsername(value: unknown): value is string {
  return (
    typeof value === 'string' && /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/.test(value)
  );
}

export async function POST(req: Request) {
  const webhookSecret = getWebhookSecret();
  if (!webhookSecret) {
    logger.error('Push webhook rejected: GITHUB_WEBHOOK_SECRET is not configured', {
      route: '/api/webhooks/github',
    });
    return NextResponse.json({ error: 'Webhook secret is not configured' }, { status: 500 });
  }

  const contentLength = Number(req.headers.get('content-length') ?? 0);
  if (contentLength > MAX_PAYLOAD_SIZE) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
  }

  const bodyText = await req.text();
  if (!bodyText || bodyText.length > MAX_PAYLOAD_SIZE) {
    return NextResponse.json(
      { error: bodyText ? 'Payload too large' : 'Empty request body' },
      {
        status: bodyText ? 413 : 400,
      }
    );
  }

  const signature = req.headers.get('x-hub-signature-256');
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
  }
  if (!verifySignature(bodyText, signature, webhookSecret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = req.headers.get('x-github-event');
  if (event === 'ping') {
    return NextResponse.json({ success: true, message: 'pong' }, { status: 200 });
  }
  if (event !== 'push') {
    // Signed but irrelevant events are acknowledged so GitHub does not retry.
    return NextResponse.json(
      { success: true, message: `Ignored event: ${event}` },
      { status: 202 }
    );
  }

  let payload: { pusher?: { name?: unknown }; sender?: { login?: unknown } };
  try {
    payload = JSON.parse(bodyText);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const username = [payload.sender?.login, payload.pusher?.name].find(isValidUsername);
  if (!username) {
    return NextResponse.json({ error: 'Payload does not identify a pusher' }, { status: 422 });
  }

  const limit = await rateLimit(
    username.toLowerCase(),
    REVALIDATE_LIMIT,
    REVALIDATE_WINDOW_MS,
    'webhook:revalidate'
  );
  if (!limit.success) {
    // Already refreshed within the window; report success so GitHub does not retry.
    return NextResponse.json(
      { success: true, message: 'Revalidation already performed recently', username },
      { status: 200 }
    );
  }

  // Drop the default and current-year cache entries; the next badge request
  // refetches fresh contribution data from GitHub.
  const currentYear = String(new Date().getUTCFullYear());
  const invalidated = await Promise.all([
    contributionsCache.delete(cacheKey('contributions', username)),
    contributionsCache.delete(cacheKey('contributions', username, currentYear)),
  ]);

  logger.info('Push webhook invalidated contribution cache', {
    route: '/api/webhooks/github',
    username,
    invalidatedKeys: invalidated.filter(Boolean).length,
  });

  return NextResponse.json({ success: true, username, revalidated: true }, { status: 200 });
}
