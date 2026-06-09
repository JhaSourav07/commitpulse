import { describe, expect, it } from 'vitest';
import { generateReadme, getEmptyReadme } from './readmeGenerator';
import type { GeneratorState } from '../types';

const baseState: GeneratorState = {
  name: 'Mayank',
  description: 'Building developer tools and analytics projects.',
  selectedTechs: ['react', 'typescript'],
  selectedSocials: ['github', 'linkedin', 'email'],
  socialLinks: {
    github: 'https://github.com/mayank200529',
    linkedin: 'https://linkedin.com/in/mayank200529',
    email: 'mayank@example.com',
  },
  showCommitPulse: true,
  githubUsername: 'mayank200529',
  commitPulseAccent: '#22c55e',
};

describe('readmeGenerator accessibility output', () => {
  it('generates headings in a logical hierarchy for screen readers', () => {
    const readme = generateReadme(baseState);

    const nameHeadingIndex = readme.indexOf("# 👋 Hi, I'm Mayank");
    const techHeadingIndex = readme.indexOf('## 🛠️ Tech Stack');
    const socialsHeadingIndex = readme.indexOf('## 🌐 Connect With Me');
    const streakHeadingIndex = readme.indexOf('## 📊 GitHub Streak');

    expect(nameHeadingIndex).toBeGreaterThanOrEqual(0);
    expect(techHeadingIndex).toBeGreaterThan(nameHeadingIndex);
    expect(socialsHeadingIndex).toBeGreaterThan(techHeadingIndex);
    expect(streakHeadingIndex).toBeGreaterThan(socialsHeadingIndex);
  });

  it('adds accessible alt text and title labels to technology icons', () => {
    const readme = generateReadme(baseState);

    expect(readme).toMatch(/alt="React"/i);
    expect(readme).toMatch(/title="React"/i);
    expect(readme).toMatch(/alt="TypeScript"/i);
    expect(readme).toMatch(/title="TypeScript"/i);
  });

  it('adds accessible names to social link icons for assistive technologies', () => {
    const readme = generateReadme(baseState);

    expect(readme).toMatch(/alt="GitHub"/i);
    expect(readme).toMatch(/title="GitHub"/i);
    expect(readme).toMatch(/alt="LinkedIn"/i);
    expect(readme).toMatch(/title="LinkedIn"/i);
  });

  it('keeps social links keyboard reachable through standard anchor markup', () => {
    const readme = generateReadme(baseState);

    expect(readme).toContain('<a href="https://github.com/mayank200529"');
    expect(readme).toContain('<a href="https://linkedin.com/in/mayank200529"');
    expect(readme).toContain('<a href="mailto:mayank@example.com"');
    expect(readme).not.toMatch(/tabindex="-1"/i);
  });

  it('uses descriptive CommitPulse badge alt text for screen readers', () => {
    const readme = generateReadme(baseState);

    expect(readme).toContain('[![CommitPulse Contribution Graph for mayank200529]');
    expect(readme).toContain('](https://commitpulse.vercel.app/dashboard/mayank200529)');
  });

  it('returns an accessible fallback readme with heading and description text', () => {
    const readme = getEmptyReadme();

    expect(readme).toContain("# 👋 Hi, I'm Your Name");
    expect(readme).toContain('<p>Your description goes here...</p>');
    expect(readme).toContain('<div align="center">');
  });
});
