import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { rateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { getClientIp } from '@/utils/getClientIp';
import { logger } from '@/lib/logger';

const MAX_PAYLOAD_SIZE = 1024 * 1024; // 1MB
const SIGNATURE_PREFIX = 'sha256=';
const SHA256_HEX_LENGTH = 64;
const READ_CHUNK_SIZE = 64 * 1024; // 64KB chunks

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

async function readBodyWithLimit(
  body: ReadableStream<Uint8Array> | null,
  maxBytes: number
): Promise<{ ok: true; body: string } | { ok: false; status: number; error: string }> {
  if (!body) {
    return { ok: false, status: 400, error: 'Empty request body' };
  }

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      totalBytes += value.length;
      if (totalBytes > maxBytes) {
        reader.cancel();
        return { ok: false, status: 413, error: 'Payload too large' };
      }
      chunks.push(value);
    }
  } catch {
    reader.cancel();
    return { ok: false, status: 400, error: 'Invalid payload' };
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const merged = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }

  return { ok: true, body: new TextDecoder().decode(merged) };
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

  // 2. Payload Validation — streaming read with enforced size limit
  const bodyResult = await readBodyWithLimit(req.body, MAX_PAYLOAD_SIZE);
  if (!bodyResult.ok) {
    return NextResponse.json({ error: bodyResult.error }, { status: bodyResult.status });
  }
  const bodyText = bodyResult.body;

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
