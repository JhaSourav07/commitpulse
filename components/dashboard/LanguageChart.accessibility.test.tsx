import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LanguageChart from './LanguageChart';
import type { LanguageData } from '@/types/dashboard';

// Mock IntersectionObserver for framer-motion's whileInView feature
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

describe('LanguageChart - Accessibility Standards & Screen Reader Aria Compliance (Variation 4)', () => {
  it('Inspect markup to check for correct use of accessible label coordinates (role, aria-labelledby, or aria-describedby): region role and labelledby', () => {
    render(<LanguageChart languages={mockLanguages} />);

    // Check main container region
    const region = screen.getByRole('region', { name: 'Top Languages' });
    expect(region).toBeInTheDocument();

    // Check the donut chart image role
    const donut = screen.getByRole('img', { name: /Donut chart showing top languages/i });
    expect(donut).toBeInTheDocument();
  });

  it('Assert elements that accept key focus (buttons, interactive nodes) maintain visible outline behaviors: Tailwind focus-visible classes', () => {
    const { container } = render(<LanguageChart languages={mockLanguages} />);

    // The donut chart is focusable
    const donut = screen.getByTestId('donut-chart');
    expect(donut).toHaveClass('focus-visible:ring-2', 'focus-visible:ring-blue-500');

    // The language items are focusable
    const items = container.querySelectorAll('[title]');
    expect(items.length).toBe(3);
    items.forEach((item) => {
      expect(item).toHaveClass('focus-visible:ring-2', 'focus-visible:ring-blue-500');
    });
  });

  it('Verify tooltip labels are announced with correct accessibility descriptions: title and aria-label attributes exist', () => {
    render(<LanguageChart languages={mockLanguages} />);

    // Verify first language tooltip
    const tsItem = screen.getByTitle('TypeScript makes up 60 percent of top languages');
    expect(tsItem).toBeInTheDocument();
    expect(tsItem).toHaveAttribute('aria-label', 'TypeScript: 60%');
  });

  it('Test keyboard control path selectors to ensure normal tab ordering: tabIndex=0 is set', () => {
    const { container } = render(<LanguageChart languages={mockLanguages} />);

    // Donut chart must be reachable via tab
    const donut = screen.getByTestId('donut-chart');
    expect(donut).toHaveAttribute('tabIndex', '0');

    // List items must be reachable via tab
    const items = container.querySelectorAll('[tabIndex="0"]');
    // Donut chart (1) + 3 language items = 4 focusable elements
    expect(items.length).toBe(4);
  });

  it('Confirm standard headings exist in the correct logical hierarchical order: h3 title', () => {
    render(<LanguageChart languages={mockLanguages} />);

    // H3 should exist and match the region name
    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toHaveTextContent('Top Languages');
    expect(heading).toHaveAttribute('id', 'language-chart-title');
  });
});
