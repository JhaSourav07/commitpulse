import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import LanguageChart from './LanguageChart';

class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];

  disconnect = vi.fn();
  observe = vi.fn();
  takeRecords = vi.fn(() => []);
  unobserve = vi.fn();
}

global.IntersectionObserver = MockIntersectionObserver;

const languages = [
  { name: 'TypeScript', percentage: 50, color: '#3178c6' },
  { name: 'JavaScript', percentage: 30, color: '#f7df1e' },
  { name: 'Python', percentage: 20, color: '#3572A5' },
];

describe('LanguageChart theme contrast', () => {
  it('renders light and dark theme background classes', () => {
    const { container } = render(<LanguageChart languages={languages} />);
    const card = container.firstChild as HTMLElement;

    expect(card.className).toContain('bg-white');
    expect(card.className).toContain('dark:bg-[#0a0a0a]');
  });

  it('renders title with light and dark contrast text classes', () => {
    render(<LanguageChart languages={languages} />);

    const title = screen.getByText('Top Languages');

    expect(title.className).toContain('text-gray-900');
    expect(title.className).toContain('dark:text-white');
  });

  it('keeps primary percentage text readable in both themes', () => {
    const { container } = render(<LanguageChart languages={languages} />);

    const percentageText = container.querySelector('.text-xl');

    expect(percentageText?.className).toContain('text-gray-900');
    expect(percentageText?.className).toContain('dark:text-white');
  });

  it('keeps legend percentage text contrast-safe in dark layout', () => {
    const { container } = render(<LanguageChart languages={languages} />);

    const legendValue = container.querySelector('.font-mono');

    expect(legendValue?.className).toContain('text-gray-500');
    expect(legendValue?.className).toContain('dark:text-white/60');
  });

  it('renders donut chart without clipping foreground content', () => {
    const { container } = render(<LanguageChart languages={languages} />);

    const donutChart = screen.getByTestId('donut-chart');
    const centerContent = container.querySelector('.relative.z-10');

    expect(donutChart).toBeInTheDocument();
    expect(centerContent?.className).toContain('z-10');
  });
});
