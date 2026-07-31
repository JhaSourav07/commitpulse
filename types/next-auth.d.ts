import 'next-auth';

declare module 'next-auth/jwt' {
  interface JWT {
    ghToken?: string;
    username?: string;
  }
}

declare module 'next-auth' {
  interface Session {
    hasGitHubToken?: boolean;
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      id?: string | null;
      username?: string | null;
    };
  }
}
