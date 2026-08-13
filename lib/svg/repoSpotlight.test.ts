import { describe, it, expect } from 'vitest';
import { generateRepoSpotlightSVG } from './repoSpotlight';
import { GitHubRepo } from '@/lib/github';
import { BadgeParams } from '@/types';

describe('generateRepoSpotlightSVG', () => {
  it('[Bug fix] formats pushed_at with a fixed, explicit locale', () => {
    // Construct a minimal mocked repository to satisfy the function requirements
    const mockRepo = {
      name: 'test-repo',
      description: 'A test repository',
      language: 'TypeScript',
      stargazers_count: 100,
      forks_count: 50,
      pushed_at: '2026-06-15T00:00:00Z',
      participation: [0, 5, 10, 5, 0],
    } as GitHubRepo;

    // Provide default mockup formatting arguments
    const mockParams = {
      bg: 'ffffff',
      text: '000000',
      accent: 'ff0000',
      radius: 4,
    } as BadgeParams;

    const svg = generateRepoSpotlightSVG(mockRepo, mockParams);

    // Check that our forced date outputs perfectly in the generated SVG
    expect(svg).toContain('Updated Jun 15, 2026');
  });
});
