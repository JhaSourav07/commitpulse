import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Review } from '@/models/Review';
import { verifyReviewAdmin } from '@/lib/review-admin-auth';

// ─── PATCH /api/reviews/[id] ─────────────────────────────────────────────────
// Admin-only: approve or reject a review
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = verifyReviewAdmin(req);
  if (authError) return authError;

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, message: 'Malformed JSON request body.' },
      { status: 400 }
    );
  }

  if (!body || typeof body !== 'object' || !('approved' in body)) {
    return NextResponse.json(
      { success: false, message: 'Request body must include "approved" boolean field.' },
      { status: 400 }
    );
  }

  const { approved } = body as { approved: unknown };
  if (typeof approved !== 'boolean') {
    return NextResponse.json(
      { success: false, message: '"approved" must be a boolean.' },
      { status: 400 }
    );
  }

  try {
    if (!process.env.MONGODB_URI) {
      return NextResponse.json(
        { success: false, message: 'Database configuration error.' },
        { status: 500 }
      );
    }

    await dbConnect();

    const review = await Review.findByIdAndUpdate(id, { approved }, { new: true }).lean();

    if (!review) {
      return NextResponse.json({ success: false, message: 'Review not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      review,
      message: approved ? 'Review approved.' : 'Review rejected.',
    });
  } catch (error) {
    console.error('[/api/reviews PATCH] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    );
  }
}

// ─── DELETE /api/reviews/[id] ────────────────────────────────────────────────
// Admin-only: permanently delete a review
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = verifyReviewAdmin(req);
  if (authError) return authError;

  const { id } = await params;

  try {
    if (!process.env.MONGODB_URI) {
      return NextResponse.json(
        { success: false, message: 'Database configuration error.' },
        { status: 500 }
      );
    }

    await dbConnect();

    const review = await Review.findByIdAndDelete(id).lean();

    if (!review) {
      return NextResponse.json({ success: false, message: 'Review not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Review deleted.',
    });
  } catch (error) {
    console.error('[/api/reviews DELETE] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    );
  }
}
