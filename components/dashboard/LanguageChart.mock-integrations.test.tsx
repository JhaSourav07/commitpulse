import type { ComponentProps } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import LanguageChart, { buildGradientStops } from './LanguageChart';
import type { LanguageData } from '@/types/dashboard';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      // Strip framer-motion-specific props so they don't reach the real DOM.
      initial: _i,
      animate: _a,
      exit: _e,
      transition: _t,
      whileInView: _wiv,
      whileHover: _wh,
      whileTap: _wt,
      viewport: _vp,
      ...rest
    }: ComponentProps<'div'> & { [key: string]: unknown }) => (
      <div {...(rest as ComponentProps<'div'>)}>{children}</div>
    ),
  },
}));

// Realistic language data shaped like what the GitHub contributions API produces
// after being transformed by the application's language-extraction logic.
const typicalApiResponse: LanguageData[] = [
  { name: 'TypeScript', color: '#3178c6', percentage: 55 },
  { name: 'JavaScript', color: '#f7df1e', percentage: 25 },
  { name: 'Python', color: '#3572A5', percentage: 15 },
  { name: 'CSS', color: '#563d7c', percentage: 5 },
];

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('LanguageChart — mock integrations', () => {
  it('renders all language names when given typical API-shaped data', () => {
    render(<LanguageChart languages={typicalApiResponse} />);

    expect(screen.getAllByText('TypeScript').length).toBeGreaterThan(0);
    screen.getByText('JavaScript');
    screen.getByText('Python');
    screen.getByText('CSS');
  });

  it('renders the empty-state when the API returns no language data', () => {
    render(<LanguageChart languages={[]} />);
    screen.getByText('No language data found');
  });

  it('buildGradientStops produces correct conic-gradient stops for API-shaped data', () => {
    const gradient = buildGradientStops(typicalApiResponse);

    // First stop starts at 0 %
    expect(gradient).toContain('#3178c6 0% 55%');
    // Second stop picks up where the first ended
    expect(gradient).toContain('#f7df1e 55% 80%');
    // Third stop
    expect(gradient).toContain('#3572A5 80% 95%');
    // Last stop ends at 100 %
    expect(gradient).toContain('#563d7c 95% 100%');
  });

  it('renders the top language percentage and name in the donut center', () => {
    render(<LanguageChart languages={typicalApiResponse} />);

    // The donut center shows the top language's percentage and name
    expect(screen.getAllByText('55%').length).toBeGreaterThan(0);
    expect(screen.getAllByText('TypeScript').length).toBeGreaterThan(0);
  });

  it('render output is stable across two renders with the same API data', () => {
    const { container, rerender } = render(<LanguageChart languages={typicalApiResponse} />);
    const firstHtml = container.innerHTML;

    rerender(<LanguageChart languages={typicalApiResponse} />);

    expect(container.innerHTML).toBe(firstHtml);
  });
});
