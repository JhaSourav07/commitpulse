import { describe, expect, it } from 'vitest';
import { TECHNOLOGIES, TECH_CATEGORIES, getTechById } from './technologies';

describe('technologies - Edge Cases & Empty/Missing Inputs Verification', () => {
  // 1. Render the target module or component with empty arrays or null parameters
  it('1. returns undefined when getTechById is called with null, undefined, or empty parameters', () => {
    expect(getTechById(null as unknown as string)).toBeUndefined();
    expect(getTechById(undefined as unknown as string)).toBeUndefined();
    expect(getTechById('')).toBeUndefined();
  });

  // 2. Verify that a clear, non-breaking fallback UI or error message is displayed
  // For a utility, verify that prototype properties (e.g. toString, hasOwnProperty, __proto__) return undefined fallback rather than function references or crashes.
  it('2. returns undefined when getTechById is called with invalid or prototype-matching string keys', () => {
    expect(getTechById('non-existent-technology-id')).toBeUndefined();
    expect(getTechById('toString')).toBeUndefined();
    expect(getTechById('hasOwnProperty')).toBeUndefined();
    expect(getTechById('__proto__')).toBeUndefined();
  });

  // 3. Verify standard styles are maintained in this default empty layout state
  // For a static dataset, verify the format and structures of TECHNOLOGIES list to ensure no elements have missing required properties (fallback state has no empty keys).
  it('3. confirms that all technologies define valid, non-empty values for required data fields', () => {
    expect(TECHNOLOGIES.length).toBeGreaterThan(0);
    TECHNOLOGIES.forEach((tech) => {
      expect(tech.id).toBeTruthy();
      expect(tech.name).toBeTruthy();
      expect(tech.category).toBeTruthy();
      expect(tech.iconUrl).toBeTruthy();
      expect(tech.type).toBeTruthy();
    });
  });

  // 4. Assert that no unexpected runtime errors or hydration failures occur
  // For a static dataset, ensure category integrity so every technology category successfully maps to an item in TECH_CATEGORIES, preventing mapping crash.
  it('4. asserts that all tech categories map directly to the defined list of TECH_CATEGORIES', () => {
    expect(TECH_CATEGORIES.length).toBeGreaterThan(0);
    TECHNOLOGIES.forEach((tech) => {
      expect(TECH_CATEGORIES).toContain(tech.category);
    });
  });

  // 5. Check key DOM structures to make sure empty markers exist
  // For static registry lookup, confirm uniqueness of IDs so that lookups do not collide, acting as our empty duplicates checker.
  it('5. checks that all technology IDs are unique to guarantee lookup correctness and mapping stability', () => {
    const ids = TECHNOLOGIES.map((tech) => tech.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });
});
