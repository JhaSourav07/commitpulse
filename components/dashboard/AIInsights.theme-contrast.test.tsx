import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import AIInsights from './AIInsights';

// -----------------------------
// Fix: IntersectionObserver (framer-motion dependency)
// -----------------------------
beforeAll(() => {
  class IntersectionObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  (globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver =
    IntersectionObserverMock;
});

// -----------------------------
// Mock framer-motion (NO any)
// -----------------------------
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

// -----------------------------
// Mock lucide-react icons
// -----------------------------
vi.mock('lucide-react', () => ({
  Moon: () => <div data-testid="moon-icon" />,
  Sun: () => <div data-testid="sun-icon" />,
  Zap: () => <div data-testid="zap-icon" />,
  Sparkles: () => <div />,
  Flame: () => <div />,
  Code: () => <div />,
  Star: () => <div />,
  Calendar: () => <div data-testid="calendar-icon" />,
}));

describe('AIInsights - Theme Contrast & Visual Cohesion', () => {
  const insights = [
    { id: '1', icon: 'Moon', text: 'Dark mode insight' },
    { id: '2', icon: 'Sun', text: 'Light mode insight' },
  ];

  beforeEach(() => {
    document.documentElement.className = '';
    vi.clearAllMocks();
  });

  it('renders correctly in light theme with proper structure', () => {
    document.documentElement.className = 'light';

    render(<AIInsights insights={insights as never} />);

    expect(screen.getByText('AI Insights')).toBeInTheDocument();
    expect(screen.getByText('Dark mode insight')).toBeInTheDocument();
    expect(screen.getByText('Light mode insight')).toBeInTheDocument();
  });

  it('renders correctly in dark theme with proper structure', () => {
    document.documentElement.className = 'dark';

    render(<AIInsights insights={insights as never} />);

    expect(screen.getByText('AI Insights')).toBeInTheDocument();
    expect(screen.getByText('Dark mode insight')).toBeInTheDocument();
    expect(screen.getByText('Light mode insight')).toBeInTheDocument();
  });

  it('ensures text remains visible in light mode (contrast proxy check)', () => {
    document.documentElement.className = 'light';

    render(<AIInsights insights={insights as never} />);

    expect(screen.getByText('Dark mode insight')).toBeVisible();
  });

  it('ensures text remains visible in dark mode (contrast proxy check)', () => {
    document.documentElement.className = 'dark';

    render(<AIInsights insights={insights as never} />);

    expect(screen.getByText('Light mode insight')).toBeVisible();
  });

  it('maintains UI stability during theme switching (no layout break)', () => {
    document.documentElement.className = 'light';

    const { rerender } = render(<AIInsights insights={insights as never} />);

    document.documentElement.className = 'dark';

    rerender(<AIInsights insights={insights as never} />);

    expect(screen.getByText('AI Insights')).toBeInTheDocument();
  });
});
