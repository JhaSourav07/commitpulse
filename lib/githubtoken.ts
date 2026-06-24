import 'server-only';
import { cookies } from 'next/headers';
import { getToken } from 'next-auth/jwt';
import { decryptToken } from '@/lib/crypto';

/**
 * Returns the authenticated user's GitHub OAuth token (decrypted), or
 * undefined when there is no session. Pass the result as FetchOptions.token.
 * When undefined, lib/github.ts falls back to the global PAT pool.
 *
 * Token material is read from the encrypted JWT cookie server-side only —
 * it is never exposed through the client session API.
 */
export async function getUserGitHubToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  const jwt = await getToken({
    req: {
      headers: {
        cookie: cookieStore.toString(),
      },
    },
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  });

  if (!jwt?.ghToken || typeof jwt.ghToken !== 'string') return undefined;

  try {
    return decryptToken(jwt.ghToken);
  } catch {
    return undefined; // corrupt/expired -> use global fallback
  }
}
