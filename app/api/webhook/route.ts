import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { rateLimit } from '@/lib/rate-limit';

const MAX_PAYLOAD_SIZE = 1024 * 1024; // 1MB
const SIGNATURE_PREFIX = 'sha256=';
const SHA256_HEX_LENGTH = 64;

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

  return (
    received.length === SHA256_HEX_LENGTH / 2 &&
    expected.length === received.length &&
    crypto.timingSafeEqual(expected, received)
  );
}

export async function POST(req: Request) {
  // 1. Rate Limiting
  const ip = req.headers.get('x-forwarded-for') || 'unknown_ip';
  const limit = await rateLimit(ip, 10, 60000);
  if (!limit.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const webhookSecret = getWebhookSecret();
  if (!webhookSecret) {
    console.error('CRITICAL: GITHUB_WEBHOOK_SECRET is not configured. Webhook rejected.');
    return NextResponse.json({ error: 'Webhook secret is not configured' }, { status: 500 });
  }

  // 2. Payload Validation
  const contentLength = Number(req.headers.get('content-length') || '0');
  if (contentLength > MAX_PAYLOAD_SIZE) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
  }

  let bodyText: string;
  try {
    bodyText = await req.text();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  // Ensure it's not larger than 1MB even after reading
  if (Buffer.byteLength(bodyText, 'utf8') > MAX_PAYLOAD_SIZE) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
  }

  // 3. Signature Verification
  const signature = req.headers.get('x-hub-signature-256');
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
  }

  if (!verifyWebhookSignature(bodyText, signature, webhookSecret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // Valid payload, proceed...
  let payload;
  try {
    payload = JSON.parse(bodyText);
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Handle payload...
  return NextResponse.json(
    { success: true, message: 'Webhook received securely' },
    { status: 200 }
  );
}
