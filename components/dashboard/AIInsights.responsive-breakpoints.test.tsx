import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import AIInsights from './AIInsights';
import type { ReactNode } from 'react';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className }: { children: ReactNode; className?: string }) => (
      <div className={className}>{children}</div>
    ),
  },
}));

vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('lucide-react', () => ({
  Sparkles: () => <div>SparklesIcon</div>,
  Moon: () => <div>MoonIcon</div>,
  Sun: () => <div>SunIcon</div>,
  Zap: () => <div>ZapIcon</div>,
  Calendar: () => <div>CalendarIcon</div>,
  Flame: () => <div>FlameIcon</div>,
  Code: () => <div>CodeIcon</div>,
  Star: () => <div>StarIcon</div>,
}));

describe('AIInsights responsive breakpoints', () => {
  const insights = Array.from({ length: 20 }, (_, index) => ({
    id: `${index}`,
    icon: 'Zap',
    text: `Insight item ${index + 1}`,
  }));

  beforeEach(() => {
    window.innerWidth = 375;

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query.includes('max-width'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it('renders all insight cards correctly on mobile viewport widths', () => {
    render(<AIInsights insights={insights} />);

    expect(screen.getAllByText(/Insight item/i)).toHaveLength(20);
  });

  it('maintains vertical flex layout styling for mobile screens', () => {
    const { container } = render(<AIInsights insights={insights} />);

    const flexContainer = container.querySelector('.flex.flex-col.gap-6');

    expect(flexContainer).toBeTruthy();
  });

  it('does not apply fixed width classes that could cause horizontal overflow', () => {
    const { container } = render(<AIInsights insights={insights} />);

    const fixedWidthElements = container.querySelectorAll('[class*="w-["], [class*="min-w-["]');

    expect(fixedWidthElements.length).toBe(0);
  });

  it('renders responsive content without clipping at narrow widths', () => {
    render(<AIInsights insights={insights} />);

    expect(screen.getByText('Insight item 1')).toBeTruthy();
    expect(screen.getByText('Insight item 20')).toBeTruthy();
  });

  it('preserves readable stacked layout structure across mobile devices', () => {
    const { container } = render(<AIInsights insights={insights} />);

    const cards = container.querySelectorAll('.rounded-lg');

    expect(cards.length).toBe(20);
  });
});
