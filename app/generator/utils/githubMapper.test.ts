import { describe, it, expect } from 'vitest';
import { mapGitHubData } from './githubMapper';
import type { GitHubUser, GitHubRepo, GitHubSocialAccount } from './githubMapper';

describe('mapGitHubData', () => {
  it('maps simple string fields correctly', () => {
    const user: GitHubUser = {
      name: 'John Doe',
      bio: 'A software engineer',
      blog: 'johndoe.com',
      twitter_username: 'johndoe',
      email: 'john@example.com',
    };

    const result = mapGitHubData(user, [], []);

    expect(result.name).toBe('John Doe');
    expect(result.description).toBe('A software engineer');
    expect(result.selectedSocials).toContain('twitter');
    expect(result.socialLinks['twitter']).toBe('https://x.com/johndoe');
    expect(result.selectedSocials).toContain('website');
    expect(result.socialLinks['website']).toBe('https://johndoe.com');
    expect(result.selectedSocials).toContain('email');
    expect(result.socialLinks['email']).toBe('mailto:john@example.com');
  });

  it('handles null values gracefully', () => {
    const user: GitHubUser = {
      name: null,
      bio: null,
      blog: null,
      twitter_username: null,
      email: null,
    };

    const result = mapGitHubData(user, [], []);

    expect(result.name).toBe('');
    expect(result.description).toBe('');
    expect(result.selectedSocials).toHaveLength(0);
  });

  it('maps social accounts correctly', () => {
    const user: GitHubUser = {
      name: null,
      bio: null,
      blog: null,
      twitter_username: null,
      email: null,
    };

    const socialAccounts: GitHubSocialAccount[] = [
      { provider: 'linkedin', url: 'https://linkedin.com/in/johndoe' },
      { provider: 'generic', url: 'https://twitch.tv/johndoe' },
    ];

    const result = mapGitHubData(user, [], socialAccounts);

    expect(result.selectedSocials).toContain('linkedin');
    expect(result.socialLinks['linkedin']).toBe('https://linkedin.com/in/johndoe');
    expect(result.selectedSocials).toContain('twitch');
    expect(result.socialLinks['twitch']).toBe('https://twitch.tv/johndoe');
  });

  it('maps repository languages correctly', () => {
    const user: GitHubUser = {
      name: null,
      bio: null,
      blog: null,
      twitter_username: null,
      email: null,
    };

    const repos: GitHubRepo[] = [
      { language: 'TypeScript' },
      { language: 'TypeScript' },
      { language: 'JavaScript' },
      { language: 'C++' },
      { language: 'Jupyter Notebook' },
      { language: null },
    ];

    const result = mapGitHubData(user, repos, []);

    // Sorted by frequency, so TypeScript should be first
    expect(result.selectedTechs).toContain('typescript');
    expect(result.selectedTechs).toContain('javascript');
    expect(result.selectedTechs).toContain('cplusplus');
    expect(result.selectedTechs).toContain('python');

    // Order matters - TypeScript has 2, others have 1
    expect(result.selectedTechs.indexOf('typescript')).toBeLessThan(
      result.selectedTechs.indexOf('javascript')
    );
  });
});
