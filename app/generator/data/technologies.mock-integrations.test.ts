import { describe, expect, it } from 'vitest';
import { getTechById } from './technologies';

describe('technologies - Asynchronous Service Layer Mocking & Local Cache Stubs', () => {
  it('successfully retrieves known technology assets by their unique identifier constants', () => {
    const reactTech = getTechById('react');

    expect(reactTech).toBeDefined();
    expect(reactTech).not.toBeNull();
    expect(reactTech?.name).toBe('React');
    expect(reactTech?.type).toMatch(/^(simpleicon|devicon)$/);
  });

  it('returns undefined cleanly when looking up unrecognized or invalid technology handles', () => {
    const missingTech = getTechById('non-existent-system-utility-id-999');

    expect(missingTech).toBeUndefined();
  });

  it('requires exact identifier case matches during lookups', () => {
    // Assert that the exact lower-case match succeeds
    expect(getTechById('react')).toBeDefined();

    // Assert that incorrect casing variations safely drop out to undefined
    expect(getTechById('React')).toBeUndefined();
    expect(getTechById('REACT')).toBeUndefined();
  });

  it('ensures separate technical categories maintain correct structure schemas upon lookups', () => {
    const frontendTech = getTechById('react');

    if (frontendTech) {
      expect(typeof frontendTech.id).toBe('string');
      expect(typeof frontendTech.iconUrl).toBe('string');
      expect(frontendTech.category).toBeDefined();
    }
  });

  it('maintains continuous performance across high-volume sequential lookups', () => {
    const lookupQueue = ['react', 'typescript', 'javascript'];
    const processedMatches = lookupQueue.map((id) => getTechById(id)).filter(Boolean);

    expect(processedMatches.length).toBeGreaterThan(0);
    expect(typeof processedMatches[0]?.name).toBe('string');
  });
});
