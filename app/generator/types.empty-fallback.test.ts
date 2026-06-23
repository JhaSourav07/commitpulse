import { describe, it, expect } from 'vitest';

import type {
  GeneratorState,
  Technology,
  Social,
  TechCategory,
  SocialCategory,
  IconType,
} from './types';

describe('GeneratorTypes Edge Cases & Empty/Missing Inputs Verification', () => {
  it('supports empty generator state structures safely', () => {
    const state: GeneratorState = {
      name: '',
      description: '',
      selectedTechs: [],
      selectedSocials: [],
      socialLinks: {},
      githubUsername: '',
      showCommitPulse: false,
      commitPulseAccent: '',
      showSnakeGraph: false,
      showPacmanGraph: false,
      graphPlacement: 'top',
    };

    expect(state.selectedTechs).toEqual([]);
    expect(state.socialLinks).toEqual({});
  });

  it('handles empty technology objects with minimal valid fallback values', () => {
    const tech: Technology = {
      id: '',
      name: '',
      category: 'Other',
      iconUrl: '',
      type: 'devicon',
    };

    expect(tech.category).toBe('Other');
  });

  it('handles empty social objects with optional fields omitted', () => {
    const social: Social = {
      id: '',
      name: '',
      category: 'Social Media',
      iconUrl: '',
      type: 'simpleicon',
      baseUrl: '',
      placeholder: '',
    };

    expect(social.siSlug).toBeUndefined();
  });

  it('supports all valid icon type fallbacks', () => {
    const iconTypes: IconType[] = ['devicon', 'simpleicon'];

    expect(iconTypes).toContain('devicon');
    expect(iconTypes).toContain('simpleicon');
  });

  it('supports valid category fallback assignments', () => {
    const techCategory: TechCategory = 'Other';
    const socialCategory: SocialCategory = 'Support';

    expect(techCategory).toBe('Other');
    expect(socialCategory).toBe('Support');
  });
});
