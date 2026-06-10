/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import LanguageChart, { buildGradientStops } from './LanguageChart';

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

const mockLanguages = [
  {
    name: 'TypeScript',
    percentage: 72,
    color: '#3178c6',
  },
  {
    name: 'JavaScript',
    percentage: 28,
    color: '#f7df1e',
  },
];

describe('LanguageChart Mouse Interactivity', () => {
  it('renders empty state when no languages are provided', () => {
    render(<LanguageChart languages={[]} />);

    expect(screen.getByText(/No language data found/i)).toBeInTheDocument();
  });

  it('buildGradientStops generates correct gradient ranges', () => {
    const result = buildGradientStops(mockLanguages);

    expect(result).toContain('#3178c6 0% 72%');
    expect(result).toContain('#f7df1e 72% 100%');
  });

  it('renders donut chart when language data exists', () => {
    render(<LanguageChart languages={mockLanguages} />);

    expect(screen.getByTestId('donut-chart')).toBeInTheDocument();
  });

  it('renders primary language information in chart center', () => {
    render(<LanguageChart languages={mockLanguages} />);

    expect(screen.getAllByText('TypeScript').length).toBeGreaterThan(0);

    expect(screen.getAllByText('72%').length).toBeGreaterThan(0);
  });

  it('renders all language rows with percentages', () => {
    render(<LanguageChart languages={mockLanguages} />);

    expect(screen.getByText('JavaScript')).toBeInTheDocument();

    expect(screen.getAllByText('28%').length).toBeGreaterThan(0);
  });
});
