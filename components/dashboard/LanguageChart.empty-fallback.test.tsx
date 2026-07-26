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
describe('LanguageChart empty fallback', () => {
  it('renders fallback UI for empty languages array', () => {
    render(<LanguageChart languages={[]} />);

    expect(screen.getByText('Top Languages')).toBeInTheDocument();
    expect(screen.getByText('No language data found')).toBeInTheDocument();
  });

  it('does not render language percentage markers in empty state', () => {
    render(<LanguageChart languages={[]} />);

    expect(screen.queryByText('%')).not.toBeInTheDocument();
  });

  it('keeps the fallback layout stable', () => {
    const { container } = render(<LanguageChart languages={[]} />);

    expect(container.firstChild).toBeInTheDocument();
    expect(container.textContent).toContain('No language data found');
  });

  it('does not throw runtime error for empty languages array', () => {
    expect(() => render(<LanguageChart languages={[]} />)).not.toThrow();
  });

  it('returns empty gradient stops for empty language data', () => {
    expect(buildGradientStops([])).toBe('');
  });
});
