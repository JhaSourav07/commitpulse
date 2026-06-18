import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import { encryptToken } from '@/lib/crypto';

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
      session.hasGitHubToken = Boolean(token.ghToken);
      session.ghToken = token.ghToken as string | undefined;
      return session;
    },
  },
});
