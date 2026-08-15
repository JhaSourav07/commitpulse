/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ImpactDashboardPage from './page';

vi.mock('framer-motion', () => ({
  motion: {
    section: ({ children, className, ...props }: any) => {
      delete props.initial;
      delete props.animate;
      delete props.transition;
      return (
        <section className={className} {...props}>
          {children}
        </section>
      );
    },
    div: ({ children, className, ...props }: any) => {
      delete props.initial;
      delete props.animate;
      delete props.transition;
      return (
        <div className={className} {...props}>
          {children}
        </div>
      );
    },
  },
  AnimatePresence: ({ children }: any) => children,
}));

vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'impact_dashboard.page_title': 'Impact & RepoReel Studio',
        'impact_dashboard.page_subtitle':
          'Translate code contributions into real-world value & social videos',
        'impact_dashboard.tab_metrics': 'Value Metrics',
        'reporeel.tab_studio': 'RepoReel Studio',
        'impact_dashboard.title': 'Real-World Impact Dashboard',
        'reporeel.title': 'RepoReel Studio',
      };
      return map[key] ?? key;
    },
  }),
}));

describe('ImpactDashboardPage', () => {
  it('renders page titles and defaults to Value Metrics tab', () => {
    render(<ImpactDashboardPage />);
    expect(screen.getByText('Impact & RepoReel Studio')).toBeDefined();
    expect(screen.getByText('Real-World Impact Dashboard')).toBeDefined();
  });

  it('switches between Value Metrics and RepoReel Studio tabs', () => {
    render(<ImpactDashboardPage />);

    const studioTabBtn = screen.getAllByText('RepoReel Studio')[0];
    fireEvent.click(studioTabBtn);
    expect(screen.getAllByText('RepoReel Studio').length).toBeGreaterThanOrEqual(1);

    const metricsTabBtn = screen.getByText('Value Metrics');
    fireEvent.click(metricsTabBtn);
    expect(screen.getByText('Real-World Impact Dashboard')).toBeDefined();
  });
});
