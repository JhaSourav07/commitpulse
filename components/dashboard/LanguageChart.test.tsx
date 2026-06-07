/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import LanguageChart from './LanguageChart';

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
});
