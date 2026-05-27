import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getDashboardUrl } from './urls';

describe('getDashboardUrl', () => {
  const originalWindow = global.window;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.window = originalWindow;
  });

  it('should return the local dashboard URL when window is defined (Client-side)', () => {
    // Explicitly define window context using a type assertion to unknown first to satisfy ESLint
    global.window = {
      location: {
        origin: 'http://localhost:3000',
      },
    } as unknown as Window & typeof globalThis;

    const result = getDashboardUrl('testuser');
    expect(result).toBe('http://localhost:3000/dashboard/testuser');
  });

  it('should return the fallback production URL when window is undefined (SSR environment)', () => {
    // Use the exact comment string ESLint is demanding here
    // @ts-expect-error - window needs to be deleted to safely mock server-side rendering environments
    delete global.window;

    const result = getDashboardUrl('testuser');
    expect(result).toBe('https://commitpulse.vercel.app/dashboard/testuser');
  });
});
