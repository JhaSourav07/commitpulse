import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import LanguageChart, { buildGradientStops } from './LanguageChart';

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

const massiveLanguages = Array.from({ length: 1000 }, (_, index) => ({
  name: `Language-${index}`,
  percentage: Number((100 / 1000).toFixed(2)),
  color: `#${(index + 100000).toString(16).slice(0, 6)}`,
}));

describe('LanguageChart massive scaling', () => {
  it('renders without crashing for massive language dataset', () => {
    render(<LanguageChart languages={massiveLanguages} />);

    expect(screen.getByText('Top Languages')).toBeInTheDocument();
    expect(screen.getAllByText('Language-0').length).toBeGreaterThan(0);
  });

  it('renders high-volume language labels safely', () => {
    render(<LanguageChart languages={massiveLanguages} />);

    expect(screen.getByText('Language-10')).toBeInTheDocument();
    expect(screen.getByText('Language-999')).toBeInTheDocument();
  });

  it('handles extremely large percentage values without runtime failure', () => {
    const highMetricLanguages = [
      { name: 'TypeScript', percentage: 999999, color: '#3178c6' },
      { name: 'JavaScript', percentage: 888888, color: '#f7df1e' },
      { name: 'Python', percentage: 777777, color: '#3572A5' },
    ];

    render(<LanguageChart languages={highMetricLanguages} />);

    expect(screen.getAllByText('TypeScript').length).toBeGreaterThan(0);
    expect(screen.getAllByText('999999%').length).toBeGreaterThan(0);
  });

  it('keeps gradient stop generation stable for massive data', () => {
    const gradientStops = buildGradientStops(massiveLanguages);

    expect(gradientStops).toContain('#');
    expect(gradientStops.length).toBeGreaterThan(1000);
  });

  it('renders massive dataset within acceptable performance limits', () => {
    const start = performance.now();

    render(<LanguageChart languages={massiveLanguages} />);

    const end = performance.now();

    expect(end - start).toBeLessThan(500);
  });
});
