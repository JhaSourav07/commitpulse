import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RepositoryHealthMonitor from './RepositoryHealthMonitor';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      className,
      ...props
    }: {
      children: React.ReactNode;
      className?: string;
      [key: string]: unknown;
    }) => {
      const safeProps = { ...props };
      delete safeProps.initial;
      delete safeProps.animate;
      delete safeProps.transition;
      return (
        <div className={className} {...safeProps}>
          {children}
        </div>
      );
    },
  },
}));

// Mock translation context
vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => {
      const translations: Record<string, string> = {
        'dashboard.health.title': 'Repository Health Monitor',
        'dashboard.health.subtitle':
          'Automated health grading and growth analytics for your repositories.',
        'dashboard.health.no_data': 'No repository data available.',
        'dashboard.health.filter.all': 'All',
        'dashboard.health.filter.healthy': 'Healthy (A/B)',
        'dashboard.health.filter.growth': 'High Growth',
        'dashboard.health.filter.at_risk': 'Archive Candidate',
        'dashboard.health.columns.repo': 'Repository',
        'dashboard.health.columns.grade': 'Health Grade',
        'dashboard.health.columns.score': 'Score',
        'dashboard.health.columns.status': 'Signal',
        'dashboard.health.columns.stars': 'Stars',
        'dashboard.health.columns.forks': 'Forks',
        'dashboard.health.columns.commits': 'Commits',
        'dashboard.health.signals.growth': 'High Growth',
        'dashboard.health.signals.stable': 'Healthy',
        'dashboard.health.signals.risk': 'Archive Candidate',
        'dashboard.impact.months': 'months',
        'dashboard.impact.years': 'years',
      };
      return translations[key] || options?.defaultValue || key;
    },
  }),
}));

describe('RepositoryHealthMonitor Component', () => {
  const mockRepos = [
    {
      name: 'elite-repo',
      commits: 100,
      stars: 150,
      forks: 50,
      createdAt: '2025-01-01',
      primaryLanguage: { name: 'TypeScript', color: '#3178c6' },
      url: 'https://github.com/user/elite-repo',
    },
    {
      name: 'inactive-repo',
      commits: 2,
      stars: 1,
      forks: 0,
      createdAt: '2024-01-01',
      primaryLanguage: { name: 'JavaScript', color: '#f1e05a' },
      url: 'https://github.com/user/inactive-repo',
    },
  ];

  it('renders table headers and entries correctly', () => {
    render(<RepositoryHealthMonitor repositories={mockRepos} />);

    expect(screen.getByText('Repository Health Monitor')).toBeDefined();
    expect(screen.getByText('elite-repo')).toBeDefined();
    expect(screen.getByText('inactive-repo')).toBeDefined();
  });

  it('calculates grades correctly', () => {
    render(<RepositoryHealthMonitor repositories={mockRepos} />);

    // elite-repo has 100 commits and 150 stars -> High Score -> Grade A
    expect(screen.getByText('A')).toBeDefined();

    // inactive-repo has 2 commits and 1 star -> Low Score -> Grade F or D
    expect(screen.queryByText('F')).toBeDefined();
  });

  it('filters repositories based on status tabs', () => {
    render(<RepositoryHealthMonitor repositories={mockRepos} />);

    // Under 'All' filter, both repos are shown
    expect(screen.queryByText('elite-repo')).not.toBeNull();
    expect(screen.queryByText('inactive-repo')).not.toBeNull();

    // Switch filter to 'Healthy (A/B)'
    fireEvent.click(screen.getByText('Healthy (A/B)'));
    expect(screen.queryByText('elite-repo')).not.toBeNull();
    expect(screen.queryByText('inactive-repo')).toBeNull(); // inactive-repo is not A/B
  });
});
