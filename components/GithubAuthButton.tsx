'use client';
import { signIn, signOut, useSession } from 'next-auth/react';

export function GitHubAuthButton() {
  const { data: session } = useSession();
  return session ? (
    <button onClick={() => signOut()}>Sign out</button>
  ) : (
    <button onClick={() => signIn('github')}>Sign in with GitHub</button>
  );
}
