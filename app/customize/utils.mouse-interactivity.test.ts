import { describe, expect, it } from 'vitest';

import { stripHash, isValidHex, getBadgeUrl, getExportSnippet } from './utils';

describe('utils mouse interactivity (Variation 5)', () => {
  it('preserves tooltip color values by stripping hash prefixes', () => {
    expect(stripHash('#ff0000')).toBe('ff0000');
  });

  it('validates hover-highlight hex colors correctly', () => {
    expect(isValidHex('abcdef')).toBe(true);
    expect(isValidHex('#123456')).toBe(true);
    expect(isValidHex('xyz123')).toBe(false);
  });

  it('generates badge url used by interactive previews', () => {
    const url = getBadgeUrl('user=testuser');

    expect(url).toContain('user=testuser');
    expect(url).toContain('/api/streak');
  });

  it('creates markdown snippet for interactive badge previews', () => {
    const snippet = getExportSnippet('markdown', 'user=testuser');

    expect(snippet).toContain('testuser');
    expect(snippet).toContain('CommitPulse');
  });

  it('creates html snippet suitable for hoverable badge rendering', () => {
    const snippet = getExportSnippet('html', 'user=testuser');

    expect(snippet).toContain('<img');
    expect(snippet).toContain('alt=');
    expect(snippet).toContain('testuser');
  });
});
