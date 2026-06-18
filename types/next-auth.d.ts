import 'next-auth';

declare module 'next-auth/jwt' {
  interface JWT {
    ghToken?: string;
  }
}

declare module 'next-auth' {
  interface Session {
    hasGitHubToken?: boolean;
    ghToken?: string;
  }
}
