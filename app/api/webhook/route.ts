import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { rateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { getClientIp } from '@/utils/getClientIp';
import { logger } from '@/lib/logger';
import { parseWebhookEvent, cacheEvent, evaluateAlerts } from '@/services/github/webhook-handler';

const MAX_PAYLOAD_SIZE = 1024 * 1024; // 1MB
const SIGNATURE_PREFIX = 'sha256=';

function getWebhookSecret(): string | null {
  const secret = process.env.GITHUB_WEBHOOK_SECRET?.trim();
  return secret || null;
}

function verifyWebhookSignature(bodyText: string, signature: string, secret: string): boolean {
  if (!signature.startsWith(SIGNATURE_PREFIX)) {
    return false;
  }

  const signatureHex = signature.slice(SIGNATURE_PREFIX.length);
  if (!/^[a-f0-9]{64}$/i.test(signatureHex)) {
    return false;
  }

  const expectedHex = crypto.createHmac('sha256', secret).update(bodyText).digest('hex');
  const expected = Buffer.from(expectedHex, 'hex');
  const received = Buffer.from(signatureHex, 'hex');

  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}

export async function POST(req: Request) {
  // 1. Rate Limiting — isolated namespace prevents cross-route interference
  const ip = getClientIp(req);
  const limit = await rateLimit(ip, 10, 60000, 'webhook');
  if (!limit.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: getRateLimitHeaders(limit) }
    );
  }

  const webhookSecret = getWebhookSecret();
  if (!webhookSecret) {
    logger.error('Webhook rejected: GITHUB_WEBHOOK_SECRET is not configured', {
      route: '/api/webhook',
    });
    return NextResponse.json({ error: 'Webhook secret is not configured' }, { status: 500 });
  }

  // 2. Payload Validation — read body with size limit
  const contentLength = Number(req.headers.get('content-length') ?? 0);
  if (contentLength > MAX_PAYLOAD_SIZE) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
  }

  const bodyText = await req.text();
  if (!bodyText || bodyText.length > MAX_PAYLOAD_SIZE) {
    return NextResponse.json(
      { error: bodyText ? 'Payload too large' : 'Empty request body' },
      { status: bodyText ? 413 : 400 }
    );
  }

  // 3. Signature Verification
  const signature = req.headers.get('x-hub-signature-256');
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
  }

  if (!verifyWebhookSignature(bodyText, signature, webhookSecret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // 4. Parse the event payload
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(bodyText);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // 5. Process the webhook event — parse, cache, and evaluate alerts
  try {
    const event = parseWebhookEvent(payload as Parameters<typeof parseWebhookEvent>[0]);

    if (!event) {
      logger.info('Webhook received but not a CI/CD event', {
        route: '/api/webhook',
        event: payload.event,
      });
      return NextResponse.json(
        { success: true, message: 'Event acknowledged (not a CI/CD event)' },
        { status: 200 }
      );
    }

    // Cache the event for analytics and reporting
    await cacheEvent(event);

    // Evaluate and send alerts if configured
    await evaluateAlerts(event);

    logger.info('Webhook event processed successfully', {
      route: '/api/webhook',
      type: event.type,
      repository: event.repository,
      status: event.status,
    });

    return NextResponse.json(
      {
        success: true,
        event: {
          type: event.type,
          repository: event.repository,
          status: event.status,
          timestamp: event.timestamp,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Webhook processing error', { route: '/api/webhook', error });
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 });
  }
}
