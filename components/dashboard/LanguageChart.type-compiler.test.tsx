/* eslint-disable @typescript-eslint/no-explicit-any */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import LanguageChart from './LanguageChart';
import type { LanguageData } from '@/types/dashboard';

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

const twoLanguages: LanguageData[] = [
  { name: 'TypeScript', color: '#3178c6', percentage: 70 },
  { name: 'JavaScript', color: '#f7df1e', percentage: 30 },
];

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('LanguageChart — runtime behaviour', () => {
  it('renders the "Top Languages" heading for both empty and populated data', () => {
    const { unmount } = render(<LanguageChart languages={[]} />);
    screen.getByText('Top Languages');
    unmount();

    render(<LanguageChart languages={twoLanguages} />);
    screen.getByText('Top Languages');
  });

  it('renders the donut chart with the correct aria-label for the top language', () => {
    render(<LanguageChart languages={twoLanguages} />);
    const donut = screen.getByRole('img');
    expect(donut.getAttribute('aria-label')).toContain('TypeScript');
    expect(donut.getAttribute('aria-label')).toContain('70%');
  });

  it('renders a color swatch for each language in the legend', () => {
    const { container } = render(<LanguageChart languages={twoLanguages} />);
    const swatches = container.querySelectorAll('.w-2.h-2.rounded-full');
    expect(swatches).toHaveLength(2);
    expect((swatches[0] as HTMLElement).style.backgroundColor).toBe('rgb(49, 120, 198)');
    expect((swatches[1] as HTMLElement).style.backgroundColor).toBe('rgb(247, 223, 30)');
  });

  it('renders the percentage for each language in the legend', () => {
    render(<LanguageChart languages={twoLanguages} />);
    const percentages = screen.getAllByText(/\d+%/);
    const texts = percentages.map((el) => el.textContent);
    expect(texts).toContain('70%');
    expect(texts).toContain('30%');
  });

  it('each language row has an accessible aria-label with name and percentage', () => {
    const { container } = render(<LanguageChart languages={twoLanguages} />);
    const rows = container.querySelectorAll('[aria-label]');
    const labels = Array.from(rows).map((el) => el.getAttribute('aria-label'));
    expect(labels).toContain('TypeScript: 70%');
    expect(labels).toContain('JavaScript: 30%');
  });
});
