import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import OpenSourceImpactScore from './OpenSourceImpactScore';
import type { Repository } from '@/types/dashboard';

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
      delete safeProps.whileInView;
      delete safeProps.viewport;
      delete safeProps.transition;
      return (
        <div className={className} {...safeProps}>
          {children}
        </div>
      );
    },
    circle: ({ ...props }) => {
      const safeProps = { ...props };
      delete safeProps.initial;
      delete safeProps.animate;
      delete safeProps.transition;
      return <circle {...safeProps} />;
    },
  },
}));

// Mock translation context
vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'dashboard.openSourceImpact.title': 'Open Source Impact Score',
        'dashboard.openSourceImpact.subtitle':
          'Measure overall community contribution impact and influence footprint',
        'dashboard.openSourceImpact.noData': 'No open source impact data available',
        'dashboard.openSourceImpact.influenceScore': 'Influence Score',
        'dashboard.openSourceImpact.rank': 'Global Impact Rank',
        'dashboard.openSourceImpact.stars': 'Stars',
        'dashboard.openSourceImpact.forks': 'Forks',
      };
      return translations[key] || key;
    },
  }),
}));

describe('OpenSourceImpactScore Component', () => {
  const mockRepos: Repository[] = [
    {
      name: 'awesome-repo',
      description: 'A stellar repository',
      stargazerCount: 100,
      forkCount: 20,
      url: 'https://github.com/test/awesome-repo',
      primaryLanguage: { name: 'TypeScript', color: '#3178c6' },
    },
    {
      name: 'simple-repo',
      description: 'A simple repository',
      stargazerCount: 5,
      forkCount: 1,
      url: 'https://github.com/test/simple-repo',
      primaryLanguage: { name: 'JavaScript', color: '#f1e05a' },
    },
  ];

  it('renders fallback when repositories array is empty', () => {
    render(<OpenSourceImpactScore repositories={[]} totalContributions={0} />);
    expect(screen.getByText('No open source impact data available')).toBeDefined();
  });

  it('calculates total stars, forks and renders influence gauge score correctly', () => {
    render(<OpenSourceImpactScore repositories={mockRepos} totalContributions={50} />);

    expect(screen.getByText('Open Source Impact Score')).toBeDefined();
    expect(
      screen.getByText('Measure overall community contribution impact and influence footprint')
    ).toBeDefined();

    // Check total stars (100 + 5 = 105)
    expect(screen.getByText('105')).toBeDefined();

    // Check total forks (20 + 1 = 21)
    expect(screen.getByText('21')).toBeDefined();

    // Check rank
    expect(screen.getByText('Global Impact Rank')).toBeDefined();
  });

  it('calculates weighted impact scores for repositories correctly', () => {
    render(<OpenSourceImpactScore repositories={mockRepos} totalContributions={50} />);

    // Check repository name rendering
    expect(screen.getByText('awesome-repo')).toBeDefined();
    expect(screen.getByText('simple-repo')).toBeDefined();

    // Check weighted impact score:
    // awesome-repo: 100 stars * 5 + 20 forks * 10 + 15 = 715
    // simple-repo: 5 stars * 5 + 1 fork * 10 + 15 = 50
    expect(screen.getByText('Score: 715')).toBeDefined();
    expect(screen.getByText('Score: 50')).toBeDefined();
  });
});
