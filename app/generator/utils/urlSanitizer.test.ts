import { describe, it, expect, vi } from 'vitest';
import { sanitizeSocialUrl } from './urlSanitizer';

// We need to mock SOCIALS to test against consistent data
vi.mock('../data/socials', () => ({
  SOCIALS: [
    { id: 'twitter', baseUrl: 'https://x.com/' },
    { id: 'github', baseUrl: 'https://github.com/' },
    { id: 'linkedin', baseUrl: 'https://linkedin.com/in/' },
    { id: 'email', baseUrl: 'mailto:' },
    { id: 'youtube', baseUrl: 'https://youtube.com/@' },
  ],
}));

describe('sanitizeSocialUrl', () => {
  it('preserves existing behavior when users enter only a handle', () => {
    expect(sanitizeSocialUrl('twitter', 'myhandle')).toBe('myhandle');
    expect(sanitizeSocialUrl('github', 'johndoe')).toBe('johndoe');
  });

  it('trims whitespace', () => {
    expect(sanitizeSocialUrl('twitter', '  myhandle  ')).toBe('myhandle');
    expect(sanitizeSocialUrl('github', '  https://github.com/johndoe  ')).toBe('johndoe');
  });

  it('extracts handle from full URL', () => {
    expect(sanitizeSocialUrl('twitter', 'https://x.com/myhandle')).toBe('myhandle');
    expect(sanitizeSocialUrl('github', 'https://github.com/johndoe')).toBe('johndoe');
    expect(sanitizeSocialUrl('linkedin', 'https://www.linkedin.com/in/johndoe')).toBe('johndoe');
    expect(sanitizeSocialUrl('youtube', 'https://youtube.com/@mychannel')).toBe('mychannel');
  });

  it('handles query parameters and hash', () => {
    expect(sanitizeSocialUrl('twitter', 'https://x.com/myhandle?s=21')).toBe('myhandle');
    expect(sanitizeSocialUrl('github', 'https://github.com/johndoe#profile')).toBe('johndoe');
  });

  it('handles trailing slash', () => {
    expect(sanitizeSocialUrl('twitter', 'https://x.com/myhandle/')).toBe('myhandle');
    expect(sanitizeSocialUrl('linkedin', 'https://linkedin.com/in/johndoe/')).toBe('johndoe');
  });

  it('handles email specific extraction', () => {
    expect(sanitizeSocialUrl('email', 'mailto:test@example.com')).toBe('test@example.com');
    expect(sanitizeSocialUrl('email', 'test@example.com')).toBe('test@example.com');
  });

  it('handles invalid or unrecognized URLs gracefully', () => {
    expect(sanitizeSocialUrl('twitter', 'https://invalid-url.com/something')).toBe(
      'https://invalid-url.com/something'
    );
    expect(sanitizeSocialUrl('github', 'just-a-random-string')).toBe('just-a-random-string');
  });

  it('handles URL without protocol but matching baseUrl', () => {
    expect(sanitizeSocialUrl('twitter', 'x.com/myhandle')).toBe('myhandle');
    expect(sanitizeSocialUrl('github', 'github.com/johndoe')).toBe('johndoe');
  });
});
