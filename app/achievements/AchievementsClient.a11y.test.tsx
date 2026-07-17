import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AchievementsClient from './AchievementsClient';
import type { AchievementsResponse } from '@/types/achievements';

describe('AchievementsClient search input accessibility', () => {
  beforeEach(() => {
    // No ?username -> the empty state renders, which contains both username search inputs.
    window.history.replaceState({}, '', '/achievements');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('gives both username search inputs an accessible name (not just a placeholder)', () => {
    render(<AchievementsClient />);

    // Found by accessible name; placeholders alone would not satisfy this query.
    const inputs = screen.getAllByRole('textbox', { name: /search github username/i });
    expect(inputs).toHaveLength(2);

    const placeholders = inputs.map((input) => input.getAttribute('placeholder'));
    expect(placeholders).toContain('e.g. jhasourav07');
    expect(placeholders).toContain('Search user...');
  });

  it('gives the achievement filter input an accessible name in the loaded view', async () => {
    // The achievement filter only appears once a profile is loaded, so drive the
    // auto-fetch via the URL and mock the API response.
    window.history.replaceState({}, '', '/achievements?username=octocat');

    const mockData: AchievementsResponse = {
      username: 'octocat',
      profile: {
        avatarUrl: 'https://avatars.githubusercontent.com/u/1?v=4',
        name: 'The Octocat',
        login: 'octocat',
      },
      overview: {
        totalAchievements: 0,
        unlockedCount: 0,
        completionPercent: 0,
        totalXp: 0,
        developerLevel: 1,
        xpForCurrentLevel: 0,
        xpForNextLevel: 100,
        levelProgress: 0,
      },
      categories: [],
      recentUnlocks: [],
      nextAchievement: null,
    };

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, json: async () => mockData }) as Response)
    );

    render(<AchievementsClient />);

    const filter = await screen.findByRole('textbox', { name: /search achievements/i });
    expect(filter).toHaveAttribute('placeholder', 'Search achievements by name or description...');
  });
});
