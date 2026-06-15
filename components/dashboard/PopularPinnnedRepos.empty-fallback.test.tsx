import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PopularRepos } from './PopularPinnnedRepos';

describe('PopularRepos - Edge Cases & Empty/Missing Inputs Verification', () => {
  it('1. returns null when all repository arrays are empty or undefined', () => {
    const { container } = render(<PopularRepos />);
    expect(container.innerHTML).toBe('');
  });

  it('2. returns null when all repository arrays are explicitly empty', () => {
    const { container } = render(
      <PopularRepos popularRepos={[]} pinnedRepos={[]} starredRepos={[]} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('3. shows "No popular repositories found" when pinned has data but popular is empty', () => {
    const repo = {
      name: 'pinned-one',
      description: 'Pinned repo',
      stargazerCount: 5,
      forkCount: 2,
      url: 'https://github.com/user/pinned-one',
      primaryLanguage: { name: 'TypeScript', color: '#3178c6' },
    };
    render(<PopularRepos popularRepos={[]} pinnedRepos={[repo]} />);
    expect(screen.getByText(/No popular repositories found/i)).toBeTruthy();
  });

  it('4. renders a repo with null description and null primaryLanguage without crashing', () => {
    const repo = {
      name: 'minimal-repo',
      description: null,
      stargazerCount: 0,
      forkCount: 0,
      url: 'https://github.com/user/minimal-repo',
      primaryLanguage: null,
    };
    render(<PopularRepos popularRepos={[repo]} />);
    expect(screen.getByText('minimal-repo')).toBeTruthy();
    expect(screen.getByText('No description provided.')).toBeTruthy();
  });

  it('5. renders multiple repos showing the correct count and "No description" fallback', () => {
    const repos = [
      {
        name: 'repo-a',
        description: 'Has a description',
        stargazerCount: 10,
        forkCount: 3,
        url: 'https://github.com/user/repo-a',
        primaryLanguage: { name: 'Rust', color: '#dea584' },
      },
      {
        name: 'repo-b',
        description: null,
        stargazerCount: 0,
        forkCount: 0,
        url: 'https://github.com/user/repo-b',
        primaryLanguage: null,
      },
    ];
    render(<PopularRepos popularRepos={repos} />);
    expect(screen.getByText('repo-a')).toBeTruthy();
    expect(screen.getByText('repo-b')).toBeTruthy();
    expect(screen.getAllByText(/No description/i).length).toBe(1);
  });

  it('6. shows "No pinned repositories found" when switching by passing only starred data', () => {
    const repo = {
      name: 'starred-one',
      description: 'A starred repo',
      stargazerCount: 42,
      forkCount: 10,
      url: 'https://github.com/user/starred-one',
      primaryLanguage: { name: 'Python', color: '#3572A5' },
    };
    render(<PopularRepos popularRepos={[]} pinnedRepos={[]} starredRepos={[repo]} />);
    expect(screen.getByText(/No popular repositories found/i)).toBeTruthy();
  });
});
