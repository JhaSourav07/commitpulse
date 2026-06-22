import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LanguageMasteryAnalytics from './LanguageMasteryAnalytics';
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
      delete safeProps.animate;
      delete safeProps.exit;
      delete safeProps.whileInView;
      delete safeProps.viewport;
      delete safeProps.transition;
      return (
        <div className={className} {...safeProps}>
          {children}
        </div>
      );
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock translation context
vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string>) => {
      const translations: Record<string, string> = {
        'dashboard.languagesMastery.title': 'Language Mastery Analytics',
        'dashboard.languagesMastery.subtitle': 'Track programming language evolution and momentum',
        'dashboard.languagesMastery.noData': 'No language statistics available',
        'dashboard.languagesMastery.expertTitle': 'Specialized Expert',
        'dashboard.languagesMastery.polyglotTitle': 'Active Polyglot',
      };
      let val = translations[key] || key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          val = val.replace(`{{${k}}}`, v);
        });
      }
      return val;
    },
  }),
}));

describe('LanguageMasteryAnalytics Component', () => {
  const mockLanguages = [
    { name: 'TypeScript', color: '#3178c6', percentage: 75 },
    { name: 'JavaScript', color: '#f1e05a', percentage: 20 },
    { name: 'HTML', color: '#e34c26', percentage: 5 },
  ];

  const mockRepos: Repository[] = [
    {
      name: 'repo1',
      description: 'A TypeScript repository',
      stargazerCount: 5,
      forkCount: 2,
      url: 'https://github.com/test/repo1',
      primaryLanguage: { name: 'TypeScript', color: '#3178c6' },
    },
    {
      name: 'repo2',
      description: 'A JavaScript game',
      stargazerCount: 15,
      forkCount: 4,
      url: 'https://github.com/test/repo2',
      primaryLanguage: { name: 'JavaScript', color: '#f1e05a' },
    },
  ];

  it('renders fallback when languages array is empty', () => {
    render(<LanguageMasteryAnalytics languages={[]} popularRepos={[]} />);
    expect(screen.getByText('No language statistics available')).toBeDefined();
  });

  it('renders title, subtitle, tabs and scores correctly', () => {
    render(<LanguageMasteryAnalytics languages={mockLanguages} popularRepos={mockRepos} />);

    expect(screen.getByText('Language Mastery Analytics')).toBeDefined();
    expect(screen.getByText('Track programming language evolution and momentum')).toBeDefined();

    // Check tabs
    expect(screen.getByRole('tab', { name: 'Overview' })).toBeDefined();
    expect(screen.getByRole('tab', { name: 'Timeline' })).toBeDefined();
    expect(screen.getByRole('tab', { name: 'Insights' })).toBeDefined();

    // Check language names in overview
    expect(screen.getByText('TypeScript')).toBeDefined();
    expect(screen.getByText('JavaScript')).toBeDefined();
  });

  it('filters content when clicking tab navigation buttons', () => {
    render(<LanguageMasteryAnalytics languages={mockLanguages} popularRepos={mockRepos} />);

    const timelineTab = screen.getByRole('tab', { name: 'Timeline' });
    const insightsTab = screen.getByRole('tab', { name: 'Insights' });
    const overviewTab = screen.getByRole('tab', { name: 'Overview' });

    // Click Timeline tab
    fireEvent.click(timelineTab);
    expect(screen.getByText('repo1')).toBeDefined();
    expect(screen.getByText('repo2')).toBeDefined();

    // Click Insights tab
    fireEvent.click(insightsTab);
    // TypeScript is 75%, so it should trigger the 'Specialized Expert' insight title
    expect(screen.getByText('Specialized Expert')).toBeDefined();

    // Click back to Overview tab
    fireEvent.click(overviewTab);
    expect(screen.getByText('TypeScript')).toBeDefined();
  });

  it('is accessible and complies with standard tab roles', () => {
    render(<LanguageMasteryAnalytics languages={mockLanguages} popularRepos={mockRepos} />);

    expect(screen.getByRole('tablist')).toBeDefined();
    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBe(3);
  });
});
