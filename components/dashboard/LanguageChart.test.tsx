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

describe('LanguageChart', () => {
  it('renders an empty state when no language data is available', () => {
    render(<LanguageChart languages={[]} />);

    expect(screen.getByText('Top Languages')).toBeDefined();
    expect(screen.getByText('No language data found')).toBeDefined();
  });

  it('renders the primary language and language breakdown', () => {
    render(
      <LanguageChart
        languages={[
          { name: 'TypeScript', percentage: 72, color: '#3178c6' },
          { name: 'JavaScript', percentage: 28, color: '#f1e05a' },
        ]}
      />
    );

    expect(screen.getAllByText('72%')).toHaveLength(2);
    expect(screen.getAllByText('TypeScript')).toHaveLength(2);
    expect(screen.getByText('JavaScript')).toBeDefined();
  });

  it('renders every language row passed to the component', () => {
    const languages = [
      { name: 'TypeScript', percentage: 30, color: '#3178c6' },
      { name: 'JavaScript', percentage: 20, color: '#f1e05a' },
      { name: 'Python', percentage: 15, color: '#3572A5' },
      { name: 'Go', percentage: 12, color: '#00ADD8' },
      { name: 'Rust', percentage: 8, color: '#dea584' },
      { name: 'Ruby', percentage: 6, color: '#701516' },
      { name: 'PHP', percentage: 5, color: '#4F5D95' },
      { name: 'CSS', percentage: 4, color: '#563d7c' },
    ];

    render(<LanguageChart languages={languages} />);

    const renderedLanguageNameElements = screen.getAllByText(
      (content, element) =>
        languages.some((language) => language.name === content) &&
        element?.className === 'text-[#A1A1AA]'
    );

    expect(renderedLanguageNameElements).toHaveLength(8);
  });
});

describe('buildGradientStops', () => {
  it('builds gradient for one language', () => {
    const result = buildGradientStops([
      {
        name: 'TypeScript',
        percentage: 100,
        color: '#3178c6',
      },
    ]);

    expect(result).toBe('#3178c6 0% 100%');
  });

  it('builds gradient for two languages', () => {
    const result = buildGradientStops([
      {
        name: 'TypeScript',
        percentage: 60,
        color: '#3178c6',
      },
      {
        name: 'JavaScript',
        percentage: 40,
        color: '#f7df1e',
      },
    ]);

    expect(result).toBe('#3178c6 0% 60%, #f7df1e 60% 100%');
  });

  it('handles decimal percentages correctly', () => {
    const result = buildGradientStops([
      {
        name: 'TS',
        percentage: 33.3,
        color: '#3178c6',
      },
      {
        name: 'JS',
        percentage: 66.7,
        color: '#f7df1e',
      },
    ]);

    expect(result).toBe('#3178c6 0% 33.3%, #f7df1e 33.3% 100%');
  });
});
