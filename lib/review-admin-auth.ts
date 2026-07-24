import { NextResponse } from 'next/server';

/**
 * Verifies the request carries a valid admin bearer token.
 *
 * The REVIEW_ADMIN_SECRET env var must be set. Clients send the token
 * via the Authorization header: `Authorization: Bearer <secret>`.
 */
export function verifyReviewAdmin(req: Request): NextResponse | null {
  const secret = process.env.REVIEW_ADMIN_SECRET;
  if (!secret) {
    return NextResponse.json(
      { success: false, message: 'Admin access is not configured.' },
      { status: 503 }
    );
  }

  const authHeader = req.headers.get('authorization');
  if (!authHeader || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized: invalid or missing admin token.' },
      { status: 401 }
    );
  }

  return null; // null means auth passed
}
