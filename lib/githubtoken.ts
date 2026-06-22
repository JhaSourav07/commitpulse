import 'server-only';
import { auth } from '@/auth';
import { decryptToken } from '@/lib/crypto';

/**
 * Returns the authenticated user's GitHub OAuth token (decrypted), or
 * undefined when there is no session. Pass the result as FetchOptions.token.
 * When undefined, lib/github.ts falls back to the global PAT pool.
 */
export async function getUserGitHubToken(): Promise<string | undefined> {
  const session = await auth();
  if (!session?.ghToken) return undefined;
  try {
    return decryptToken(session.ghToken);
  } catch {
    return undefined; // corrupt/expired -> use global fallback
  }
}
