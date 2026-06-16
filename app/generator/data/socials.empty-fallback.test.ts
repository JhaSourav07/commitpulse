import { describe, expect, it } from 'vitest';
import { SOCIALS, SOCIAL_CATEGORIES, getSocialById } from './socials';
import type { Social } from '../types';

describe('Socials Data Edge Cases & Empty-Fallback Verification', () => {
  // 1. Empty Data Structures
  // Verify empty arrays or empty exported collections are handled safely.
  it('handles empty query parameters and empty/missing string lookups safely without throwing', () => {
    // Lookup with an empty string ID should return undefined
    const resultEmpty = getSocialById('');
    expect(resultEmpty).toBeUndefined();

    // Querying with spaces or padding should also return undefined safely
    const resultSpaces = getSocialById('   ');
    expect(resultSpaces).toBeUndefined();
  });

  // 2. Null / Undefined Inputs
  // Verify null, undefined, or missing optional values do not cause runtime failures.
  it('handles null and undefined input parameters in lookup safely', () => {
    // Typecast to any to test runtime protection for consumers passing bad parameters
    const resultNull = getSocialById(null as unknown as string);
    expect(resultNull).toBeUndefined();

    const resultUndefined = getSocialById(undefined as unknown as string);
    expect(resultUndefined).toBeUndefined();
  });

  // 3. Fallback Defaults
  // Confirm default values or fallback structures remain valid when optional properties are absent.
  it('guarantees valid required fallback properties when optional properties (like siSlug) are absent', () => {
    SOCIALS.forEach((social) => {
      // siSlug is optional. If it is not provided, verify all other properties are present and valid.
      if (!social.siSlug) {
        expect(social.id).toBeDefined();
        expect(typeof social.id).toBe('string');
        expect(social.id.length).toBeGreaterThan(0);

        expect(social.name).toBeDefined();
        expect(typeof social.name).toBe('string');
        expect(social.name.length).toBeGreaterThan(0);

        expect(social.baseUrl).toBeDefined();
        expect(typeof social.baseUrl).toBe('string');
        expect(social.baseUrl.length).toBeGreaterThan(0);
      }

      // Ensure that all optional/nullable fields match their expected type if defined
      if (social.siSlug !== undefined) {
        expect(typeof social.siSlug).toBe('string');
        expect(social.siSlug.length).toBeGreaterThan(0);
      }
    });
  });

  // 4. Runtime Stability
  // Ensure iterating over empty, missing, or mixed resolved objects does not throw unexpected errors.
  it('maintains stability when iterating or mapping over a list of resolved social objects including invalid lookups', () => {
    // Scenario: A consuming component maps list of user selection IDs, which might contain empty/unrecognized values.
    const selectedIds = ['github', 'invalid_social_id', '', 'twitter', 'discord'];

    const resolvedSocials: (Social | undefined)[] = selectedIds.map((id) => getSocialById(id));

    // Ensure we can iterate, filter, and access properties safely without throwing exceptions
    expect(() => {
      const activeSocials = resolvedSocials.filter((s): s is Social => s !== undefined);

      expect(activeSocials.length).toBe(3); // github, twitter, discord

      activeSocials.forEach((social) => {
        // Accessing properties should be completely stable
        const link = `${social.baseUrl}username`;
        expect(link.length).toBeGreaterThan(social.baseUrl.length);
      });
    }).not.toThrow();
  });

  // 5. Expected Empty-State Structure
  // Verify expected keys, markers, or placeholder structures exist so consuming components can safely render fallback UI.
  it('guarantees that all items contain placeholder and category keys to prevent UI rendering errors', () => {
    // Consuming components rely on placeholders and categories to render fallback inputs.
    SOCIALS.forEach((social) => {
      // Placeholder structure must exist and start with the standard 'e.g. ' pattern
      expect(social.placeholder).toBeDefined();
      expect(typeof social.placeholder).toBe('string');
      expect(social.placeholder.startsWith('e.g. ')).toBe(true);

      // Category must exist and be defined in the SOCIAL_CATEGORIES array
      expect(social.category).toBeDefined();
      expect(SOCIAL_CATEGORIES).toContain(social.category);

      // Icon URLs must be valid format to prevent broken fallback image UI
      expect(social.iconUrl).toBeDefined();
      expect(typeof social.iconUrl).toBe('string');
      expect(social.iconUrl.startsWith('https://')).toBe(true);
    });
  });
});
