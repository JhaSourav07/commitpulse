// lib/svg/generator.escapeXML.test.ts

import { describe, it, expect } from 'vitest';
import { escapeXML } from './sanitizer';

describe('escapeXML', () => {
  it('escapes script-like XML boundary characters safely', () => {
    expect(escapeXML('<script>&"')).toBe('&lt;script&gt;&amp;&quot;');
  });

  it('should escape all five special XML characters', () => {
    expect(escapeXML('a & b < c > d " e \' f')).toBe('a &amp; b &lt; c &gt; d &quot; e &#39; f');
  });

  it('should return plain strings unchanged', () => {
    expect(escapeXML('hello world')).toBe('hello world');
  });

  it('should return an empty string unchanged', () => {
    expect(escapeXML('')).toBe('');
  });

  it('should handle multiple occurrences of the same special character', () => {
    expect(escapeXML('a && b && c')).toBe('a &amp;&amp; b &amp;&amp; c');
  });

  it('should complete within a reasonable time for a large input', () => {
    const large = '<script>alert("xss & injection\'s")</script>'.repeat(1000);
    const start = performance.now();
    const result = escapeXML(large);
    const duration = performance.now() - start;
    expect(result).toContain('&lt;script&gt;');
    expect(duration).toBeLessThan(500);
  });
});
