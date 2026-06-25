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

  const secret = process.env.WEBHOOK_SECRET || '';
  if (!secret) return false;

  const hmac = createHmac('sha256', secret);
  hmac.update(payload);
  const expected = `sha256=${hmac.digest('hex')}`;

  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();

    if (!verifyGitHubSignature(request, payload)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(payload);
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
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { message: 'CI/CD Webhook endpoint. POST GitHub events here.' },
    { status: 200 }
  );
}
