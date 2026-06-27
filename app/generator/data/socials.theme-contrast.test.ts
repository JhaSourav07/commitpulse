import { describe, expect, it } from 'vitest';
import { SOCIALS, SOCIAL_CATEGORIES, getSocialById } from './socials';

describe('socials data integrity and lookup behavior', () => {
  it('ensures all social ids are unique', () => {
    const ids = SOCIALS.map((social) => social.id);
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(ids.length);
  });

  it('returns the correct social metadata when looked up by id', () => {
    const github = getSocialById('github');

    expect(github).toBeDefined();
    expect(github?.id).toBe('github');
    expect(github?.name).toBe('GitHub');
    expect(github?.category).toBe('Developer');
    expect(github?.baseUrl).toBe('https://github.com/');
  });

  it('returns undefined for unknown social ids', () => {
    expect(getSocialById('does-not-exist')).toBeUndefined();
  });

  it('ensures every social belongs to a valid category', () => {
    SOCIALS.forEach((social) => {
      expect(SOCIAL_CATEGORIES).toContain(social.category);
    });
  });

  it('ensures social entries contain valid urls and placeholders', () => {
    SOCIALS.forEach((social) => {
      expect(social.baseUrl.length).toBeGreaterThan(0);
      expect(social.placeholder.length).toBeGreaterThan(0);

      expect(social.baseUrl.startsWith('https://') || social.baseUrl.startsWith('mailto:')).toBe(
        true
      );
    });
  });

  it('ensures every social id can be retrieved through getSocialById', () => {
    SOCIALS.forEach((social) => {
      const found = getSocialById(social.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(social.id);
    });
  });
});
