import { describe, expect, it, vi } from 'vitest';
import { generateReadme } from './readmeGenerator';
import type { GeneratorState } from '../types';

vi.mock('../data/technologies', () => ({
  getTechById: (id: string) => ({
    id,
    name: `Tech-${id}`,
    iconUrl: `https://cdn.devicon.dev/${id}/original.svg`,
    type: 'devicon',
  }),
}));

vi.mock('../data/socials', () => ({
  getSocialById: (id: string) => ({
    id,
    name: `Social-${id}`,
    iconUrl: `https://cdn.example.com/socials/${id}.svg`,
    type: 'devicon',
  }),
}));

function buildState(overrides: Partial<GeneratorState> = {}): GeneratorState {
  return {
    name: '',
    description: '',
    selectedTechs: [],
    selectedSocials: [],
    socialLinks: {},
    showCommitPulse: false,
    githubUsername: '',
    commitPulseAccent: '#ffffff',
    showRepoSpotlight: false,
    spotlightRepo: '',
    showSnakeGraph: false,
    showPacmanGraph: false,
    graphPlacement: 'bottom',
    ...overrides,
  } as GeneratorState;
}

describe('readmeGenerator - Massive Data Sets and Extreme High Bounds Scaling', () => {
  it('renders all 1000 tech stack entries without truncation or omission', () => {
    const massiveTechs = Array.from({ length: 1000 }, (_, i) => `${i}`);
    const state = buildState({ name: 'Dev', selectedTechs: massiveTechs });

    const output = generateReadme(state);

    expect(output).toContain('## 🛠️ Tech Stack');
    // Spot-check first, middle, and last entries to confirm no truncation
    expect(output).toContain('Tech-0');
    expect(output).toContain('Tech-499');
    expect(output).toContain('Tech-999');
    // Total img tag count must exactly match input — no entries dropped
    const imgMatches = output.match(/<img /g) ?? [];
    expect(imgMatches.length).toBe(1000);
  });

  it('handles extreme length name and description strings without crashing or truncating', () => {
    const longName = 'X'.repeat(10000);
    const longDescription = 'Y'.repeat(10000);
    const state = buildState({ name: longName, description: longDescription });

    const output = generateReadme(state);

    // Full strings must appear unmodified — no slicing or buffer overflow
    expect(output).toContain(longName);
    expect(output).toContain(`<p>${longDescription}</p>`);
    // Heading structure must remain intact despite extreme string lengths
    expect(output).toContain("# 👋 Hi, I'm");
  });

  it('generates readme for 5000 techs and 5000 socials within 500ms performance limit', () => {
    const massiveTechs = Array.from({ length: 5000 }, (_, i) => `${i}`);
    const socialIds = Array.from({ length: 5000 }, (_, i) => `s${i}`);
    const socialLinks = Object.fromEntries(
      socialIds.map((id) => [id, `https://example.com/${id}`])
    );

    const state = buildState({
      name: 'Perf User',
      selectedTechs: massiveTechs,
      selectedSocials: socialIds,
      socialLinks,
    });

    const start = performance.now();
    const output = generateReadme(state);
    const duration = performance.now() - start;

    expect(output).toContain('## 🛠️ Tech Stack');
    expect(output).toContain('## 🌐 Connect With Me');
    expect(duration).toBeLessThan(500);
  });

  it('renders all 500 social link entries with correct href values without dropping any', () => {
    const socialIds = Array.from({ length: 500 }, (_, i) => `s${i}`);
    const socialLinks = Object.fromEntries(
      socialIds.map((id) => [id, `https://example.com/profile/${id}`])
    );

    const state = buildState({ selectedSocials: socialIds, socialLinks });

    const output = generateReadme(state);

    expect(output).toContain('## 🌐 Connect With Me');
    // Spot-check representative href values across the full range
    expect(output).toContain('https://example.com/profile/s0');
    expect(output).toContain('https://example.com/profile/s249');
    expect(output).toContain('https://example.com/profile/s499');
    // Total anchor count must exactly match input — no entries silently omitted
    const anchorMatches = output.match(/<a href=/g) ?? [];
    expect(anchorMatches.length).toBe(500);
  });

  it('preserves all section headings in correct structural order under combined extreme load', () => {
    const massiveTechs = Array.from({ length: 200 }, (_, i) => `${i}`);
    const socialIds = Array.from({ length: 200 }, (_, i) => `s${i}`);
    const socialLinks = Object.fromEntries(
      socialIds.map((id) => [id, `https://example.com/${id}`])
    );

    const state = buildState({
      name: 'Extreme User',
      description: 'D'.repeat(5000),
      selectedTechs: massiveTechs,
      selectedSocials: socialIds,
      socialLinks,
      showCommitPulse: true,
      githubUsername: 'extremeuser',
      commitPulseAccent: '#00ff00',
      showRepoSpotlight: false,
      spotlightRepo: '',
      showSnakeGraph: true,
      showPacmanGraph: true,
      graphPlacement: 'bottom',
    });

    const output = generateReadme(state);

    // All section headings must be present in the output
    expect(output).toContain("# 👋 Hi, I'm Extreme User");
    expect(output).toContain('## 🛠️ Tech Stack');
    expect(output).toContain('## 🌐 Connect With Me');
    expect(output).toContain('## 📊 GitHub Streak');
    expect(output).toContain('## 🐍 Snake Contribution Graph');
    expect(output).toContain('## 👾 Pacman Contribution Graph');

    // Sections must appear in correct document order — no layout tree breakage
    const positions = {
      tech: output.indexOf('## 🛠️ Tech Stack'),
      social: output.indexOf('## 🌐 Connect With Me'),
      streak: output.indexOf('## 📊 GitHub Streak'),
      snake: output.indexOf('## 🐍 Snake Contribution Graph'),
      pacman: output.indexOf('## 👾 Pacman Contribution Graph'),
    };

    expect(positions.tech).toBeLessThan(positions.social);
    expect(positions.social).toBeLessThan(positions.streak);
    expect(positions.streak).toBeLessThan(positions.snake);
    expect(positions.snake).toBeLessThan(positions.pacman);
  });
});
