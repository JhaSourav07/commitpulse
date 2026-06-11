import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { RateLimiter } from '@/lib/rate-limit';

const MAX_PAYLOAD_SIZE = 1024 * 1024; // 1MB
const webhookRateLimiter = new RateLimiter(60, 60_000, 1);

function verifySignature(body: string, signature: string, secret: string): boolean {
  if (!/^sha256=[0-9a-f]{64}$/i.test(signature)) return false;

  const expected = Buffer.from(
    `sha256=${crypto.createHmac('sha256', secret).update(body).digest('hex')}`,
    'utf8'
  );
  const received = Buffer.from(signature, 'utf8');

  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}

export async function POST(req: Request) {
  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    console.error('CRITICAL: GITHUB_WEBHOOK_SECRET is not configured. Webhook endpoint disabled.');
    return NextResponse.json({ error: 'Webhook is not configured' }, { status: 503 });
  }

  // 1. Rate Limiting
  if (!(await webhookRateLimiter.check('github-webhook'))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  // 2. Payload Validation
  const contentLength = Number(req.headers.get('content-length') || '0');
  if (contentLength > MAX_PAYLOAD_SIZE) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
  }

  let bodyText: string;
  try {
    bodyText = await req.text();
  } catch {
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

  if (!verifySignature(bodyText, signature, webhookSecret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // Valid payload, proceed...
  try {
    JSON.parse(bodyText);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Handle payload...
  return NextResponse.json(
    { success: true, message: 'Webhook received securely' },
    { status: 200 }
  );
}
