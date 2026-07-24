import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Review } from '@/models/Review';
import { reviewPostSchema } from '@/lib/validations';
import { getClientIp } from '@/utils/getClientIp';
import { DistributedCache } from '@/lib/cache';
import { verifyReviewAdmin } from '@/lib/review-admin-auth';

import { getRateLimitHeaders, notifyRateLimiter } from '@/lib/rate-limit';
import { validateCSRF } from '@/lib/security/csrf';

const reviewWriteCache = new DistributedCache<number>(5000, 60000);
const REVIEW_WRITE_COOLDOWN_MS = 10 * 60 * 1000;

const MAX_REVIEWS_PER_PAGE = 50;

// ─── GET /api/reviews ────────────────────────────────────────────────────────
// Admin-only: fetch pending or all reviews
export async function GET(req: Request) {
  const authError = verifyReviewAdmin(req);
  if (authError) return authError;

  try {
    if (!process.env.MONGODB_URI) {
      return NextResponse.json({ success: true, reviews: [] });
    }

    await dbConnect();

    const url = new URL(req.url);
    const status = url.searchParams.get('status') ?? 'pending';
    const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
    const limit = Math.min(
      MAX_REVIEWS_PER_PAGE,
      Math.max(1, parseInt(url.searchParams.get('limit') ?? '20', 10))
    );

    const filter: Record<string, unknown> = {};
    if (status === 'pending') filter.approved = false;
    else if (status === 'approved') filter.approved = true;

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Review.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[/api/reviews GET] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    );
  }
}

// ─── POST /api/reviews ────────────────────────────────────────────────────────
// Submit a testimonial review for the Wall of Love
export async function POST(req: Request) {
  const csrfError = validateCSRF(req);
  if (csrfError) return csrfError;

  const ip = getClientIp(req);
  const rateLimitKey =
    ip && ip !== 'unknown' ? ip : `unknown:${req.headers.get('user-agent') ?? 'no-agent'}`;

  const rateLimitResult = await notifyRateLimiter.checkWithResult(rateLimitKey);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { success: false, message: 'Too many requests, please try again later.' },
      { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, message: 'Malformed JSON request body.' },
      { status: 400 }
    );
  }

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
      { status: 429, headers: { 'Retry-After': remaining.toString() } }
    );
  }

  try {
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

    const docCount = await Review.countDocuments();
    if (docCount >= 5000) {
      return NextResponse.json(
        {
          success: false,
          message: 'Review collection is at capacity. Please try again later.',
        },
        { status: 503 }
      );
    }

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
        message:
          'Your testimonial has been received. It will be reviewed by an admin before appearing on the Wall of Love.',
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
