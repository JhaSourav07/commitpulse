import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

// Mock next/image to render native <img> element
vi.mock('next/image', () => ({
  default: ({
    unoptimized: _u,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & { unoptimized?: boolean }) => <img {...props} />,
}));

describe('Avatar Image Fallback Guarding', () => {
  it('attempts fallback URL once on initial broken avatar image error', () => {
    const userDetails = {
      login: 'octocat',
      avatar_url: 'https://avatars.githubusercontent.com/u/583231',
    };

    const handleAvatarError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      const img = e.currentTarget as HTMLImageElement;
      if (img.dataset.fallbackAttempted === 'true') {
        img.style.display = 'none';
        return;
      }
      img.dataset.fallbackAttempted = 'true';
      const fallbackUrl = `https://github.com/${userDetails.login}.png`;
      if (img.src !== fallbackUrl && !img.src.endsWith(`/${userDetails.login}.png`)) {
        img.src = fallbackUrl;
      } else {
        img.style.display = 'none';
      }
    };

    const { container } = render(
      <img src={userDetails.avatar_url} alt={userDetails.login} onError={handleAvatarError} />
    );

    const img = container.querySelector('img') as HTMLImageElement;
    expect(img.dataset.fallbackAttempted).toBeUndefined();

    // Trigger first error event (initial broken image)
    fireEvent.error(img);

    expect(img.dataset.fallbackAttempted).toBe('true');
    expect(img.src).toBe('https://github.com/octocat.png');
    expect(img.style.display).not.toBe('none');
  });

  it('stops overwriting src and hides image if fallback also fails', () => {
    const userDetails = {
      login: 'octocat',
      avatar_url: 'https://avatars.githubusercontent.com/u/583231',
    };

    const handleAvatarError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      const img = e.currentTarget as HTMLImageElement;
      if (img.dataset.fallbackAttempted === 'true') {
        img.style.display = 'none';
        return;
      }
      img.dataset.fallbackAttempted = 'true';
      const fallbackUrl = `https://github.com/${userDetails.login}.png`;
      if (img.src !== fallbackUrl && !img.src.endsWith(`/${userDetails.login}.png`)) {
        img.src = fallbackUrl;
      } else {
        img.style.display = 'none';
      }
    };

    const { container } = render(
      <img src={userDetails.avatar_url} alt={userDetails.login} onError={handleAvatarError} />
    );

    const img = container.querySelector('img') as HTMLImageElement;

    // Trigger 1st error event (primary src broken)
    fireEvent.error(img);
    expect(img.dataset.fallbackAttempted).toBe('true');
    expect(img.src).toBe('https://github.com/octocat.png');

    // Trigger 2nd error event (fallback src broken as well)
    fireEvent.error(img);

    // Should stop mutating src and hide the element
    expect(img.src).toBe('https://github.com/octocat.png');
    expect(img.style.display).toBe('none');
  });

  it('immediately hides image if initial src is already the fallback URL and fails', () => {
    const userDetails = { login: 'octocat', avatar_url: 'https://github.com/octocat.png' };

    const handleAvatarError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      const img = e.currentTarget as HTMLImageElement;
      if (img.dataset.fallbackAttempted === 'true') {
        img.style.display = 'none';
        return;
      }
      img.dataset.fallbackAttempted = 'true';
      const fallbackUrl = `https://github.com/${userDetails.login}.png`;
      if (img.src !== fallbackUrl && !img.src.endsWith(`/${userDetails.login}.png`)) {
        img.src = fallbackUrl;
      } else {
        img.style.display = 'none';
      }
    };

    const { container } = render(
      <img src={userDetails.avatar_url} alt={userDetails.login} onError={handleAvatarError} />
    );

    const img = container.querySelector('img') as HTMLImageElement;

    // Trigger error event when initial src is already the fallback URL
    fireEvent.error(img);

    expect(img.dataset.fallbackAttempted).toBe('true');
    expect(img.style.display).toBe('none');
  });
});
