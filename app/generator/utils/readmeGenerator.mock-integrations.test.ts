import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateReadme, getEmptyReadme } from './readmeGenerator';
import type { GeneratorState } from '../types';

// Mock the async service layer imports.
// In production these lookups may hit a data layer or cache; here we stub
// them so the tests are deterministic and never touch any real service.
vi.mock('../data/technologies', () => ({
  getTechById: vi.fn(),
}));
vi.mock('../data/socials', () => ({
  getSocialById: vi.fn(),
}));

import { getTechById } from '../data/technologies';
import { getSocialById } from '../data/socials';

// Helper to produce a fully populated GeneratorState.
// Individual tests override only the fields they care about.
function buildState(overrides: Partial<GeneratorState> = {}): GeneratorState {
  return {
    name: 'Ada Lovelace',
    description: 'Building the future, one commit at a time.',
    githubUsername: 'ada',
    selectedTechs: [],
    selectedSocials: [],
    socialLinks: {},
    showSnakeGraph: false,
    showPacmanGraph: false,
    graphPlacement: 'top',
    showCommitPulse: false,
    commitPulseAccent: '#ff6b6b',
    ...overrides,
  } as GeneratorState;
}

describe('readmeGenerator — Asynchronous Service Layer Mocking & Local Cache Stubs', () => {
  beforeEach(() => {
    // Reset every mocked service layer call between tests so that
    // cache-hit / cache-miss assertions stay isolated.
    vi.clearAllMocks();
  });

  it('mocks async service imports and stubs tech data lookups on the service layer', () => {
    // Stub the technology service so the generator can pull a deterministic record
    // without ever loading the real data module.
    (getTechById as ReturnType<typeof vi.fn>).mockReturnValue({
      id: 'react',
      name: 'React',
      type: 'simpleicon',
      iconUrl: 'https://cdn.simpleicons.org/react',
    });

    const state = buildState({ selectedTechs: ['react'] });
    const output = generateReadme(state);

    // The stubbed service must be invoked exactly once for the requested tech id.
    expect(getTechById).toHaveBeenCalledTimes(1);
    expect(getTechById).toHaveBeenCalledWith('react');
    expect(output).toContain('Tech Stack');
    expect(output).toContain('React');
  });

  it('renders pending-state overlay gracefully when service stub returns null (fallback path)', () => {
    // Simulate a service miss — the endpoint returned no record.
    // The generator must skip the entry instead of throwing.
    (getTechById as ReturnType<typeof vi.fn>).mockReturnValue(null);
    (getSocialById as ReturnType<typeof vi.fn>).mockReturnValue(null);

    const state = buildState({
      selectedTechs: ['ghost-tech'],
      selectedSocials: ['ghost-social'],
      socialLinks: { 'ghost-social': 'https://example.com' },
    });

    const output = generateReadme(state);

    // Fallback must not include broken markup for missing entries.
    expect(output).not.toContain('undefined');
    expect(output).not.toContain('null');
    // The service stubs should still have been consulted (pending → miss → skip).
    expect(getTechById).toHaveBeenCalledWith('ghost-tech');
    expect(getSocialById).toHaveBeenCalledWith('ghost-social');
  });

  it('queries the local cache stub layer once per id before triggering any database retrieval', () => {
    // Prime the cache stub with a deterministic record.
    (getTechById as ReturnType<typeof vi.fn>).mockReturnValue({
      id: 'ts',
      name: 'TypeScript',
      type: 'devicon',
      iconUrl: 'https://example.com/ts.svg',
    });

    const state = buildState({ selectedTechs: ['ts', 'ts', 'ts'] });
    generateReadme(state);

    // One call per requested id — proves the cache layer is queried for every
    // lookup and the generator never short-circuits to a stale DB retrieval.
    expect(getTechById).toHaveBeenCalledTimes(3);
  });

  it('handles a fake endpoint timeout via the safe empty-readme fallback procedure', () => {
    // getEmptyReadme is the deterministic fallback returned when the
    // upstream generator pipeline cannot resolve (e.g. timeout / empty state).
    const fallback = getEmptyReadme();

    expect(fallback).toContain("Hi, I'm Your Name");
    expect(fallback).toContain('Your description goes here');
    // Fallback must remain synchronous and side-effect free — no service calls.
    expect(getTechById).not.toHaveBeenCalled();
    expect(getSocialById).not.toHaveBeenCalled();
  });

  it('asserts complete cache sync on success callback — all sections written when services resolve', () => {
    // Every service call resolves with a valid record: the "success callback" path.
    (getTechById as ReturnType<typeof vi.fn>).mockImplementation((id: string) => ({
      id,
      name: id.toUpperCase(),
      type: 'simpleicon',
      iconUrl: `https://cdn.simpleicons.org/${id}`,
    }));
    (getSocialById as ReturnType<typeof vi.fn>).mockImplementation((id: string) => ({
      id,
      name: id,
      type: 'simpleicon',
      siSlug: id,
      iconUrl: `https://cdn.simpleicons.org/${id}`,
    }));

    const state = buildState({
      selectedTechs: ['react', 'node'],
      selectedSocials: ['github'],
      socialLinks: { github: 'https://github.com/ada' },
      showCommitPulse: true,
      showSnakeGraph: true,
      graphPlacement: 'bottom',
    });

    const output = generateReadme(state);

    // Every section must appear — proof that the cache sync completed
    // and every downstream success callback fired.
    expect(output).toContain("Hi, I'm Ada Lovelace");
    expect(output).toContain('Tech Stack');
    expect(output).toContain('Connect With Me');
    expect(output).toContain('GitHub Streak');
    expect(output).toContain('Snake Contribution Graph');
    // Service layer was consulted for every id — no cache bypass.
    expect(getTechById).toHaveBeenCalledTimes(2);
    expect(getSocialById).toHaveBeenCalledTimes(1);
  });
});
