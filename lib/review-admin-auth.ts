import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';

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

  const authHeader = req.headers.get('authorization')?.toLowerCase() || '';

  // Constant-time comparison to prevent timing side-channel attacks
  const expected = Buffer.from(`bearer ${secret}`.toLowerCase());
  const provided = Buffer.from(authHeader);

  const isValid = expected.length === provided.length && timingSafeEqual(expected, provided);

  if (!isValid) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized: invalid or missing admin token.' },
      { status: 401 }
    );
  }

  return null; // null means auth passed
}
