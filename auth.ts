import NextAuth from 'next-auth';
import type { Session } from 'next-auth';
import GitHub from 'next-auth/providers/github';
import { encryptToken } from '@/lib/crypto';

/** Shapes the session payload returned to clients — never includes token material. */
export function buildClientSession(session: Session, token: { ghToken?: unknown }): Session {
  session.hasGitHubToken = Boolean(token.ghToken);
  return session;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: { params: { scope: 'read:user public_repo' } },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, account }) {
      if (account?.access_token) {
        token.ghToken = encryptToken(account.access_token);
      }
      return token;
    },
    async session({ session, token }) {
      return buildClientSession(session, token);
    },
  },
});
