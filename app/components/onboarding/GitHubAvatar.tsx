'use client';

import { useEffect, useState } from 'react';
import { Icons } from './icons';

type GitHubAvatarProps = {
  username: string;
  size?: 'sm' | 'md';
  className?: string;
};

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-9 w-9',
};

export function GitHubAvatar({ username, size = 'md', className = '' }: GitHubAvatarProps) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!username) return;

    const avatarUrl = `https://avatars.githubusercontent.com/${username}?size=64`;
    const img = new Image();
    img.onload = () => setSrc(avatarUrl);
    img.onerror = () => setSrc(null);
    img.src = avatarUrl;
  }, [username]);

  const dim = sizeClasses[size];

  if (!username) {
    return (
      <span
        className={`${dim} flex shrink-0 items-center justify-center rounded-full border border-black/10 bg-gray-100 text-gray-500 dark:border-white/10 dark:bg-white/5 dark:text-white/55 ${className}`}
        aria-hidden
      >
        <Icons.Github className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
      </span>
    );
  }

  if (src) {
    return (
      <img
        src={src}
        alt={`${username} on GitHub`}
        width={size === 'sm' ? 24 : 36}
        height={size === 'sm' ? 24 : 36}
        className={`${dim} shrink-0 rounded-full object-cover ring-2 ring-emerald-500/30 ${className}`}
      />
    );
  }

  return (
    <span
      className={`${dim} flex shrink-0 items-center justify-center rounded-full border border-black/10 bg-gray-100 text-gray-500 dark:border-white/10 dark:bg-white/5 dark:text-white/55 ${className}`}
      aria-hidden
    >
      <Icons.Github className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
    </span>
  );
}
