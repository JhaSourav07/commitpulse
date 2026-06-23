import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DeveloperSkillEvolution from './DeveloperSkillEvolution';
import { LanguageData, ActivityData } from '@/types/dashboard';

// Mock recharts to prevent ResponsiveContainer rendering errors in JSDOM
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container" style={{ width: '100%', height: '300px' }}>
      {children}
    </div>
  ),
  AreaChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="area-chart">{children}</div>
  ),
  Area: () => <div data-testid="area" />,
  XAxis: () => <div data-testid="xaxis" />,
  YAxis: () => <div data-testid="yaxis" />,
  Tooltip: () => <div data-testid="tooltip" />,
}));

// Mock framer-motion to prevent DOM warnings
vi.mock('framer-motion', () => ({
  motion: {
    div: (
      props: React.HTMLAttributes<HTMLDivElement> & {
        initial?: unknown;
        animate?: unknown;
        transition?: unknown;
        whileInView?: unknown;
        viewport?: unknown;
        layout?: boolean;
      }
    ) => {
      const cleanProps = { ...props };
      delete cleanProps.initial;
      delete cleanProps.animate;
      delete cleanProps.transition;
      delete cleanProps.whileInView;
      delete cleanProps.viewport;
      delete cleanProps.layout;
      return <div {...cleanProps} />;
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock translation context
vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'dashboard.skill_evolution.title': 'Developer Skill Evolution',
        'dashboard.skill_evolution.subtitle': 'Analyze technology adoption trends and progression metrics.',
      };
      return translations[key] || key;
    },
  }),
}));

describe('DeveloperSkillEvolution', () => {
  const mockLanguages: LanguageData[] = [
    { name: 'TypeScript', color: '#3178c6', percentage: 60 },
    { name: 'Go', color: '#00add8', percentage: 30 },
  ];

  const mockActivity: ActivityData[] = [
    { date: '2026-06-01', count: 10, intensity: 2 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders title and skill list items correctly', () => {
    render(<DeveloperSkillEvolution languages={mockLanguages} activity={mockActivity} />);

    expect(screen.getByText('Developer Skill Evolution')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('Go')).toBeInTheDocument();
  });

  it('filters languages when category button is clicked', async () => {
    render(<DeveloperSkillEvolution languages={mockLanguages} activity={mockActivity} />);

    // By default, category filter shows "All"
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('Go')).toBeInTheDocument();

    // Click on "Backend/Systems" category
    const backendBtn = screen.getByText('Backend/Systems');
    fireEvent.click(backendBtn);

    // TypeScript is Frontend, so it should disappear or not be in list (depending on UI filter)
    expect(screen.queryByText('TypeScript')).toBeNull();
    expect(screen.getByText('Go')).toBeInTheDocument();
  });

  it('changes selected language details when clicking on list item', () => {
    render(<DeveloperSkillEvolution languages={mockLanguages} activity={mockActivity} />);

    // Click Go list item
    const goItem = screen.getByText('Go');
    fireEvent.click(goItem);

    // Trajectory detail header should display "Go Trajectory"
    expect(screen.getByText('Go Trajectory')).toBeInTheDocument();
  });
});
