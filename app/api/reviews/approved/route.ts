import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Review } from '@/models/Review';

// ─── GET /api/reviews/approved ───────────────────────────────────────────────
// Public: fetch approved reviews for the Wall of Love
export async function GET() {
  try {
    if (!process.env.MONGODB_URI) {
      return NextResponse.json({ success: true, reviews: [] });
    }

    await dbConnect();

    const reviews = await Review.find({ approved: true }).sort({ createdAt: -1 }).limit(50).lean();

    return NextResponse.json({ success: true, reviews });
  } catch (error) {
    console.error('[/api/reviews/approved] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    );
  }
}
