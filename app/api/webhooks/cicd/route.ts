import { logger } from '@/lib/logger';
import { createHmac, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import {
  parseWebhookEvent,
  cacheEvent,
  evaluateAlerts,
  generateCIReport,
  setAlertConfig,
} from '@/services/github/webhook-handler';

export const runtime = 'nodejs';

function verifyGitHubSignature(request: NextRequest, payload: string): boolean {
  const signature = request.headers.get('x-hub-signature-256');
  if (!signature) return false;

  const SIGNATURE_PREFIX = 'sha256=';
  if (!signature.startsWith(SIGNATURE_PREFIX)) return false;

  const signatureHex = signature.slice(SIGNATURE_PREFIX.length);
  if (!/^[a-f0-9]{64}$/i.test(signatureHex)) return false;

  const secret = process.env.WEBHOOK_SECRET || '';
  if (!secret) return false;

  const hmac = createHmac('sha256', secret);
  hmac.update(payload);
  const expectedHex = hmac.digest('hex');

  const expected = Buffer.from(expectedHex, 'hex');
  const received = Buffer.from(signatureHex, 'hex');

  return expected.length === received.length && timingSafeEqual(expected, received);
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();

    if (!verifyGitHubSignature(request, payload)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    let event;
    try {
      event = JSON.parse(payload);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }
    const ciEvent = parseWebhookEvent(event);

    if (!ciEvent) {
      return NextResponse.json(
        { message: 'Event not processed (not a CI/CD event)' },
        { status: 200 }
      );
    }

    cacheEvent(ciEvent);
    await evaluateAlerts(ciEvent);

    return NextResponse.json(
      {
        success: true,
        event: {
          type: ciEvent.type,
          repository: ciEvent.repository,
          status: ciEvent.status,
          timestamp: ciEvent.timestamp,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('CI/CD webhook processing error', { error });
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { message: 'CI/CD Webhook endpoint. POST GitHub events here.' },
    { status: 200 }
  );
}
