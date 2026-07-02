import { describe, expect, it } from 'vitest';
import { resolveFont, deterministicRandom, particleCount, getSizeScale } from './generator';
import { escapeXML } from './sanitizer';

describe('generator Edge Cases & Empty/Missing Inputs Verification', () => {
  it('Case 1: resolves missing font input safely', () => {
    expect(resolveFont(undefined)).toBeNull();
    expect(resolveFont(null)).toBeNull();
  });

  it('Case 2: provides deterministic fallback behavior for empty seeds', () => {
    const first = deterministicRandom('');
    const second = deterministicRandom(undefined);

    expect(first).toBeGreaterThanOrEqual(0);
    expect(first).toBeLessThanOrEqual(1);
    expect(first).toBe(second);
  });

  it('Case 3: handles null, undefined and invalid particle counts gracefully', () => {
    expect(particleCount(undefined)).toBe(0);
    expect(particleCount(null)).toBe(0);
    expect(particleCount(NaN)).toBe(0);
    expect(particleCount(-10)).toBe(0);
  });

  it('Case 4: maintains safe fallback output for empty strings and missing sizing inputs', () => {
    expect(escapeXML('')).toBe('');
    expect(getSizeScale(undefined)).toBe(1);
    expect(getSizeScale('medium')).toBe(1);
  });

  it('Case 5: returns safe escaped output without runtime errors', () => {
    expect(() => escapeXML('')).not.toThrow();

    expect(escapeXML('<tag>&"\'')).toBe('&lt;tag&gt;&amp;&quot;&#39;');
  });
});
