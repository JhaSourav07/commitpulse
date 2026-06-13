import { describe, expect, it } from 'vitest';
import { generateReadme, getEmptyReadme } from './utils/readmeGenerator';
import type { GeneratorState } from './types';

describe('GeneratorState empty fallback verification', () => {
  const emptyState: GeneratorState = {
    name: '',
    description: '',
    selectedTechs: [],
    selectedSocials: [],
    socialLinks: {},
  };

  it('handles empty generator state without crashing', () => {
    expect(() => generateReadme(emptyState)).not.toThrow();
  });

  it('returns empty output for missing name and description', () => {
    expect(generateReadme(emptyState)).toBe('');
  });

  it('handles empty tech and social selections', () => {
    const result = generateReadme({
      ...emptyState,
      selectedTechs: [],
      selectedSocials: [],
    });

    expect(result).not.toContain('Tech Stack');
    expect(result).not.toContain('Connect With Me');
  });

  it('ignores social links when no social is selected', () => {
    const result = generateReadme({
      ...emptyState,
      socialLinks: {
        github: 'https://github.com/test',
      },
    });

    expect(result).not.toContain('github');
    expect(result).not.toThrow;
  });

  it('provides default empty README fallback', () => {
    const result = getEmptyReadme();

    expect(result).toContain("Hi, I'm Your Name");
    expect(result).toContain('Your description goes here...');
  });
});
