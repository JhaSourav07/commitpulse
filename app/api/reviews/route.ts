import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Review } from '@/models/Review';
import { reviewPostSchema } from '@/lib/validations';
import { getClientIp } from '@/utils/getClientIp';
import { DistributedCache } from '@/lib/cache';
import { notifyRateLimiter } from '@/lib/rate-limit';
import { validateCSRF } from '@/lib/security/csrf';

// Per-IP cooldown: one submission per 10 minutes to prevent spam
const reviewWriteCache = new DistributedCache<number>(5000, 60000);
const REVIEW_WRITE_COOLDOWN_MS = 10 * 60 * 1000;

// ─── POST /api/reviews ────────────────────────────────────────────────────────
// Submit a testimonial review for the Wall of Love
export async function POST(req: Request) {
  const csrfError = validateCSRF(req);
  if (csrfError) return csrfError;
  // Rate limiting — always applied with user-agent fallback for unknown IPs
  const ip = getClientIp(req);
  const rateLimitKey =
    ip && ip !== 'unknown' ? ip : `unknown:${req.headers.get('user-agent') ?? 'no-agent'}`;

  const rateLimitResult = await notifyRateLimiter.checkWithResult(rateLimitKey);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { success: false, message: 'Too many requests, please try again later.' },
      { status: 429 }
    );
  }

  // Parse JSON body safely
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, message: 'Malformed JSON request body.' },
      { status: 400 }
    );
  }

  // Validate with Zod
  const parsed = reviewPostSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten();
    const firstError =
      Object.values(fieldErrors.fieldErrors).flat()[0] ??
      fieldErrors.formErrors[0] ??
      'Invalid request body.';
    return NextResponse.json({ success: false, message: firstError }, { status: 400 });
  }

  const { name, handle, platform, message, accentColor } = parsed.data;

  // Per-IP write cooldown to prevent rapid duplicate submissions
  const lastWrite = await reviewWriteCache.get(`review:write:${rateLimitKey}`);
  if (lastWrite) {
    const remaining = Math.max(
      1,
      Math.ceil((REVIEW_WRITE_COOLDOWN_MS - (Date.now() - lastWrite)) / 1000)
    );
    return NextResponse.json(
      {
        success: false,
        message: `Please wait ${remaining} second${remaining === 1 ? '' : 's'} before submitting another review.`,
      },
      { status: 429 }
    );
  }

  try {
    // Graceful MONGODB_URI handling
    if (!process.env.MONGODB_URI) {
      if (process.env.NODE_ENV === 'production') {
        console.error(
          'CRITICAL: MONGODB_URI is not set in production environment. Review submission is disabled.'
        );
        return NextResponse.json(
          { success: false, message: 'Database configuration error.' },
          { status: 500 }
        );
      }

      console.warn('MONGODB_URI is not set. Bypassing review submission for local development.');
      return NextResponse.json({
        success: true,
        message: 'Review submission bypassed (no database configured).',
      });
    }

    await dbConnect();

    await Review.create({
      name: name.trim(),
      handle: handle.trim(),
      platform,
      message: message.trim(),
      accentColor,
      approved: false,
    });

    await reviewWriteCache.set(
      `review:write:${rateLimitKey}`,
      Date.now(),
      REVIEW_WRITE_COOLDOWN_MS
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Your testimonial has been received. It will be featured soon!',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[/api/reviews] Error saving review:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    );
  }
}
