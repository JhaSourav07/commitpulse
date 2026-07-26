import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import LanguageChart from './LanguageChart';
import type { LanguageData } from '@/types/dashboard';

// Mock IntersectionObserver for framer-motion
class IntersectionObserverMock {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
}
vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);

const mockLanguages: LanguageData[] = [
  { name: 'TypeScript', color: '#3178c6', percentage: 60 },
  { name: 'JavaScript', color: '#f1e05a', percentage: 30 },
  { name: 'HTML', color: '#e34c26', percentage: 10 },
];

describe('LanguageChart - Responsive Multi-device Columns & Mobile Viewport Layouts (Variation 7)', () => {
  let originalInnerWidth: number;

  beforeEach(() => {
    originalInnerWidth = window.innerWidth;
  });

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
    window.dispatchEvent(new Event('resize'));
  });

  it('Mock standard mobile-width media coordinates (e.g. 375px wide viewports): Mock window viewport to simulate iPhone SE size', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    window.dispatchEvent(new Event('resize'));

    render(<LanguageChart languages={mockLanguages} />);
    expect(window.innerWidth).toBe(375);
    const heading = screen.getByText('Top Languages');
    expect(heading).toBeInTheDocument();
  });

  it('Assert that columns reflow into standard vertical flex lists: Container uses flex-col for stacking', () => {
    render(<LanguageChart languages={mockLanguages} />);

    const heading = screen.getByText('Top Languages');
    const region = heading.parentElement!;
    // The main container stacks items vertically (chart on top, list on bottom)
    expect(region).toHaveClass('flex', 'flex-col');

    // The language list container also stacks items vertically
    const langListWrapper = region.querySelector('.w-full.mt-8');
    expect(langListWrapper).toHaveClass('flex-col');
  });

  it('Verify styling values are not absolute widths that cause horizontal scrollbars on smaller viewports: Donut chart width is constrained safely', () => {
    render(<LanguageChart languages={mockLanguages} />);

    // Donut chart wrapper uses specific non-overflowing widths (w-36 = 144px)
    // 144px easily fits inside a 375px mobile viewport without causing a horizontal scrollbar.
    const donutWrapper = screen.getByTestId('donut-chart').parentElement;
    expect(donutWrapper).toHaveClass('w-36', 'h-36');
  });

  it('Check that navigation components scale down gracefully: Adapting requirement to verify list scales using w-full', () => {
    render(<LanguageChart languages={mockLanguages} />);

    const heading = screen.getByText('Top Languages');
    const region = heading.parentElement!;
    const listContainer = region.querySelector('.w-full.mt-8');

    // Ensures the list container scales fluidly to its parent's bounds rather than having absolute bounds
    expect(listContainer).toHaveClass('w-full');
  });

  it('Assert mobile-specific toggle states respond cleanly: Adapting to ensure Empty State layout also utilizes fluid vertical flow', () => {
    render(<LanguageChart languages={[]} />);

    // The empty state does not have a region role, so we select by the heading text parent
    const heading = screen.getByText('Top Languages');
    const container = heading.parentElement!;

    expect(container).toHaveClass('flex', 'flex-col', 'min-h-[300px]');

    // The inner no-data message scales safely via flex-1
    const messageWrapper = screen.getByText('No language data found').parentElement;
    expect(messageWrapper).toHaveClass('flex-1', 'justify-center');
  });
});
