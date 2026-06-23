import { describe, expect, it } from 'vitest';
import { generateReadme } from './readmeGenerator';
import { TECHNOLOGIES } from '../data/technologies';
import { SOCIALS } from '../data/socials';
import type { GeneratorState } from '../types';

const baseState = (): GeneratorState => ({
  name: 'Test User',
  description: '',
  selectedTechs: [],
  selectedSocials: [],
  socialLinks: {},
  githubUsername: '',
  showCommitPulse: false,
  commitPulseAccent: '#ffffff',
  showSnakeGraph: false,
  showPacmanGraph: false,
  graphPlacement: 'bottom',
});

// Dynamic helpers to safely retrieve simpleicon entries to prevent module-level execution errors
const getSimpleIconTech = () => {
  const tech = TECHNOLOGIES.find((t) => t.type === 'simpleicon');
  expect(tech).toBeDefined();
  return tech!;
};

const getSimpleIconSocial = () => {
  const social = SOCIALS.find((s) => s.type === 'simpleicon' && s.siSlug);
  expect(social).toBeDefined();
  return social!;
};

describe('readmeGenerator theme-contrast', () => {
  it('verifies dark-mode simpleicon tech icons use white (#ffffff) srcset', () => {
    const simpleIconTech = getSimpleIconTech();
    const state = {
      ...baseState(),
      selectedTechs: [simpleIconTech.id],
    };
    const md = generateReadme(state);

    // Assert the prefers-color-scheme dark source is active and has the white variant
    const slug = simpleIconTech.iconUrl.split('/').pop() || simpleIconTech.id;
    expect(md).toContain('<picture>');

    // Parse source tags and verify the correct media and white icon srcset
    const sourceRegex = /<source\b[^>]*>/gi;
    const sources = md.match(sourceRegex) || [];
    expect(sources.length).toBeGreaterThan(0);
    const hasDarkSource = sources.some((source) => {
      const hasDarkMedia = /media="\(prefers-color-scheme:\s*dark\)"/i.test(source);
      const hasWhiteSrcset = new RegExp(
        `srcset="https:\\/\\/cdn\\.simpleicons\\.org\\/${slug}\\/ffffff"`,
        'i'
      ).test(source);
      return hasDarkMedia && hasWhiteSrcset;
    });
    expect(hasDarkSource).toBe(true);
  });

  it('verifies light-mode simpleicon tech icons use black (#000000) as the img fallback src', () => {
    const simpleIconTech = getSimpleIconTech();
    const state = {
      ...baseState(),
      selectedTechs: [simpleIconTech.id],
    };
    const md = generateReadme(state);

    // Assert the img fallback uses the black variant for light backgrounds
    const slug = simpleIconTech.iconUrl.split('/').pop() || simpleIconTech.id;
    expect(md).toContain(`<img src="https://cdn.simpleicons.org/${slug}/000000"`);
  });

  it('verifies dark-mode simpleicon social icons use white (#ffffff) srcset', () => {
    const simpleIconSocial = getSimpleIconSocial();
    const state = {
      ...baseState(),
      selectedSocials: [simpleIconSocial.id],
      socialLinks: { [simpleIconSocial.id]: 'https://example.com/social' },
    };
    const md = generateReadme(state);

    // Assert the prefers-color-scheme dark source is active and has the white variant for socials
    expect(md).toContain('<picture>');

    // Parse source tags and verify the correct media and white icon srcset for socials
    const sourceRegex = /<source\b[^>]*>/gi;
    const sources = md.match(sourceRegex) || [];
    expect(sources.length).toBeGreaterThan(0);
    const hasDarkSource = sources.some((source) => {
      const hasDarkMedia = /media="\(prefers-color-scheme:\s*dark\)"/i.test(source);
      const hasWhiteSrcset = new RegExp(
        `srcset="https:\\/\\/cdn\\.simpleicons\\.org\\/${simpleIconSocial.siSlug}\\/ffffff"`,
        'i'
      ).test(source);
      return hasDarkMedia && hasWhiteSrcset;
    });
    expect(hasDarkSource).toBe(true);
  });

  it('verifies light-mode simpleicon social icons use black (#000000) as the img fallback src', () => {
    const simpleIconSocial = getSimpleIconSocial();
    const state = {
      ...baseState(),
      selectedSocials: [simpleIconSocial.id],
      socialLinks: { [simpleIconSocial.id]: 'https://example.com/social' },
    };
    const md = generateReadme(state);

    // Assert the img fallback uses the black variant for light backgrounds for socials
    expect(md).toContain(
      `<img src="https://cdn.simpleicons.org/${simpleIconSocial.siSlug}/000000"`
    );
  });

  it('ensures background divs and other tags do not contain style attributes that could clip/override contrast', () => {
    const simpleIconTech = getSimpleIconTech();
    const simpleIconSocial = getSimpleIconSocial();
    const state: GeneratorState = {
      name: 'John Doe',
      description: 'A passionate developer',
      selectedTechs: [simpleIconTech.id],
      selectedSocials: [simpleIconSocial.id],
      socialLinks: { [simpleIconSocial.id]: 'https://example.com/social' },
      githubUsername: 'johndoe',
      showCommitPulse: true,
      commitPulseAccent: '#ff0000',
      showSnakeGraph: true,
      showPacmanGraph: true,
      graphPlacement: 'bottom',
    };
    const md = generateReadme(state);

    // Assert that <div> elements in the output do not contain style= attributes
    const divRegex = /<div[^>]*>/g;
    const matches = md.match(divRegex);
    expect(matches).not.toBeNull();
    expect(matches?.length).toBeGreaterThan(0);
    matches?.forEach((divTag) => {
      expect(divTag).not.toContain('style=');
    });

    // Ensure all other standard structural/textual HTML elements do not contain inline styles that override theme contrast
    const allTagsRegex = /<(div|p|h1|h2|h3|a|img|picture|source)[^>]*>/g;
    const allMatches = md.match(allTagsRegex);
    expect(allMatches).not.toBeNull();
    expect(allMatches?.length).toBeGreaterThan(0);
    allMatches?.forEach((tag) => {
      expect(tag).not.toContain('style=');
    });
  });
});
