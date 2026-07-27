import { NextResponse } from 'next/server';

/**
 * Verifies the request carries a valid admin bearer token.
 *
 * The `REVIEW_ADMIN_SECRET` environment variable must be set to the
 * shared secret. Clients must include the token in the `Authorization`
 * header using the `Bearer` scheme: `Authorization: Bearer <secret>`.
 *
 * @param req - The incoming `Request` object to authenticate.
 * @returns `null` when authentication succeeds (caller should proceed).
 *          A `NextResponse` with a 401 or 503 status when authentication fails.
 *
 * @example
 * ```ts
 * const authResult = verifyReviewAdmin(request);
 * if (authResult) return authResult; // 401/503 already set
 * // proceed with admin operation...
 * ```
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
