/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import RepositoryImpactAnalyzer, { formatAge } from './RepositoryImpactAnalyzer';

// Mock framer-motion to render clean HTML containers for testing
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, style, ...props }: any) => {
      delete props.initial;
      delete props.animate;
      delete props.whileInView;
      delete props.viewport;
      delete props.transition;
      return (
        <div className={className} style={style} {...props}>
          {children}
        </div>
      );
    },
  },
}));

// Helper to create dates relative to today
function getRelativeDateString(monthsAgo: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsAgo);
  return d.toISOString();
}

describe('RepositoryImpactAnalyzer', () => {
  it('renders an empty state when no repositories are provided', () => {
    render(<RepositoryImpactAnalyzer repositories={[]} />);

    expect(screen.getByText('Repository Impact Analyzer')).toBeDefined();
    expect(screen.getByText('No repository data available.')).toBeDefined();
  });

  it('correctly ranks repositories and limits to top 5 based on weighted impact score', () => {
    // Score formulas: (commits * 3) + (stars * 5) + (forks * 10)
    const repos = [
      { name: 'Repo1', commits: 10, stars: 10, forks: 10, createdAt: getRelativeDateString(10) }, // 30 + 50 + 100 = 180
      { name: 'Repo2', commits: 50, stars: 20, forks: 5, createdAt: getRelativeDateString(10) }, // 150 + 100 + 50 = 300
      { name: 'Repo3', commits: 5, stars: 2, forks: 0, createdAt: getRelativeDateString(10) }, // 15 + 10 + 0 = 25
      { name: 'Repo4', commits: 100, stars: 100, forks: 50, createdAt: getRelativeDateString(10) }, // 300 + 500 + 500 = 1300
      { name: 'Repo5', commits: 20, stars: 50, forks: 12, createdAt: getRelativeDateString(10) }, // 60 + 250 + 120 = 430
      { name: 'Repo6', commits: 80, stars: 40, forks: 8, createdAt: getRelativeDateString(10) }, // 240 + 200 + 80 = 520
    ];

    render(<RepositoryImpactAnalyzer repositories={repos} />);

    // Top 5 rank order expected: Repo4 (1300), Repo6 (520), Repo5 (430), Repo2 (300), Repo1 (180)
    // Repo3 (25) should be excluded (ranked 6th)

    expect(screen.getByText('Repo4')).toBeDefined();
    expect(screen.getByText('Repo6')).toBeDefined();
    expect(screen.getByText('Repo5')).toBeDefined();
    expect(screen.getByText('Repo2')).toBeDefined();
    expect(screen.getByText('Repo1')).toBeDefined();
    expect(screen.queryByText('Repo3')).toBeNull();

    // Verify correct score calculations are rendered
    expect(screen.getByText('1300')).toBeDefined();
    expect(screen.getByText('520')).toBeDefined();
    expect(screen.getByText('430')).toBeDefined();
    expect(screen.getByText('300')).toBeDefined();
    expect(screen.getByText('180')).toBeDefined();
  });

  it('accurately calculates and renders growth metrics', () => {
    // Create a repo exactly 10 months old
    const tenMonthsAgo = getRelativeDateString(10);
    const repos = [
      {
        name: 'Repo-Growth',
        commits: 50,
        stars: 30,
        forks: 20,
        createdAt: tenMonthsAgo,
      },
    ];

    render(<RepositoryImpactAnalyzer repositories={repos} />);

    // Individual repo metrics verification:
    // Age = 10 months
    expect(screen.getAllByText('10 months').length).toBeGreaterThanOrEqual(1);

    // Overall growth metrics cards verification:
    // Avg Stars/Mo overall = 30 / 10 = 3
    // Avg Forks/Mo overall = 20 / 10 = 2
    expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1);
  });

  it('computes language contributions percentage correctly', () => {
    const repos = [
      {
        name: 'TS-Repo',
        commits: 70,
        primaryLanguage: { name: 'TypeScript', color: '#3178c6' },
      },
      {
        name: 'JS-Repo',
        commits: 30,
        primaryLanguage: { name: 'JavaScript', color: '#f1e05a' },
      },
    ];

    render(<RepositoryImpactAnalyzer repositories={repos} />);

    // Total commits = 100. TypeScript = 70%, JavaScript = 30%
    expect(screen.getAllByText('TypeScript').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('JavaScript').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('70%').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('30%').length).toBeGreaterThanOrEqual(1);
  });

  it('complies with accessibility (a11y) standards', () => {
    const repos = [
      {
        name: 'A11y-Repo',
        commits: 10,
        stars: 5,
        forks: 2,
        createdAt: getRelativeDateString(5),
      },
    ];

    const { container } = render(<RepositoryImpactAnalyzer repositories={repos} />);

    // Region role and labelling check
    const region = screen.getByRole('region');
    expect(region).toBeDefined();
    expect(region.getAttribute('aria-labelledby')).toBe('impact-analyzer-title');

    // Heading has matching id
    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading.id).toBe('impact-analyzer-title');

    // Language bar has image role with description
    const imgElement = screen.getByRole('img');
    expect(imgElement).toBeDefined();
    expect(imgElement.getAttribute('aria-label')).toContain('Language contribution');

    // Ranking link has informative aria-label
    const link = screen.getByRole('link');
    expect(link.getAttribute('aria-label')).toContain('Rank 1');
  });

  it('formats age correctly via helper function', () => {
    const mockT = (key: string) => {
      if (key === 'dashboard.impact.months') return 'months';
      if (key === 'dashboard.impact.years') return 'years';
      return key;
    };

    expect(formatAge(5, mockT)).toBe('5 months');
    expect(formatAge(12, mockT)).toBe('1 year');
    expect(formatAge(24, mockT)).toBe('2 years');
    expect(formatAge(15, mockT)).toBe('1y 3m');
  });
});
