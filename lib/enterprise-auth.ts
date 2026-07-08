import { NextResponse } from 'next/server';
import { auth } from '@/auth';

/**
 * Returns the authenticated session or a 401 response.
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    return {
      session: null,
      error: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
    };
  }
  return { session, error: null };
}

/**
 * Returns the authenticated session only if the user is an enterprise admin,
 * or a 403 response if not authorized.
 *
 * Enterprise admin GitHub IDs are read from the ENTERPRISE_ADMIN_GITHUB_IDS
 * environment variable (comma-separated list of GitHub user IDs).
 */
export async function requireEnterpriseAdmin() {
  const { session, error } = await requireAuth();
  if (error) return { session: null, error };

  const adminIds = (process.env.ENTERPRISE_ADMIN_GITHUB_IDS ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);

  if (adminIds.length === 0) {
    return {
      session: null,
      error: NextResponse.json(
        { error: 'Enterprise admin access not configured' },
        { status: 503 }
      ),
    };
  }

  const userId = session?.user?.id;
  if (!userId || !adminIds.includes(userId)) {
    return {
      session: null,
      error: NextResponse.json(
        { error: 'Forbidden: enterprise admin access required' },
        { status: 403 }
      ),
    };
  }

  return { session: session!, error: null };
}
