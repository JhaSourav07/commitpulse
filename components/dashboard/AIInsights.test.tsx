/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import AIInsights from './AIInsights';
import type { AIInsight } from '@/types/dashboard';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      whileHover,
      whileTap,
      whileInView,
      initial,
      animate,
      exit,
      transition,
      viewport,
      layoutId,
      ...props
    }: any) => (
      <div {...props} data-testid="motion-div">
        {children}
      </div>
    ),
  },
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Sparkles: (props: any) => <div data-testid="icon-sparkles" {...props} />,
  Moon: (props: any) => <div data-testid="icon-moon" {...props} />,
  Sun: (props: any) => <div data-testid="icon-sun" {...props} />,
  Zap: (props: any) => <div data-testid="icon-zap" {...props} />,
  Calendar: (props: any) => <div data-testid="icon-calendar" {...props} />,
  Flame: (props: any) => <div data-testid="icon-flame" {...props} />,
  Code: (props: any) => <div data-testid="icon-code" {...props} />,
  Star: (props: any) => <div data-testid="icon-star" {...props} />,
  LucideIcon: () => null,
}));

describe('AIInsights', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test 1: renders the 'AI Insights' heading
  it('should render the AI Insights heading', () => {
    const insights: AIInsight[] = [];
    render(<AIInsights insights={insights} />);

    expect(screen.getByText('AI Insights')).toBeDefined();
  });

  // Test 2: renders the correct number of insight items when given an array
  it('should render the correct number of insight items', () => {
    const insights: AIInsight[] = [
      { id: '1', icon: 'Moon', text: 'Night owl detected' },
      { id: '2', icon: 'Sun', text: 'Morning committer' },
      { id: '3', icon: 'Zap', text: 'High activity spike' },
    ];
    render(<AIInsights insights={insights} />);

    expect(screen.getByText('Night owl detected')).toBeDefined();
    expect(screen.getByText('Morning committer')).toBeDefined();
    expect(screen.getByText('High activity spike')).toBeDefined();
  });

  // Test 3: renders insight text correctly
  it('should render insight text correctly', () => {
    const insights: AIInsight[] = [
      { id: '1', icon: 'Flame', text: 'You are on fire this week!' },
      { id: '2', icon: 'Code', text: 'TypeScript is your main language' },
    ];
    render(<AIInsights insights={insights} />);

    expect(screen.getByText('You are on fire this week!')).toBeDefined();
    expect(screen.getByText('TypeScript is your main language')).toBeDefined();
  });

  // Test 4: renders empty state (empty insights array) without crashing
  it('should render empty state with no insights without crashing', () => {
    const insights: AIInsight[] = [];
    const { container } = render(<AIInsights insights={insights} />);

    // Should still render the heading
    expect(screen.getByText('AI Insights')).toBeDefined();
    // Should not crash and container should exist
    expect(container).toBeDefined();
  });

  // Test 5: unknown icon key falls back to Sparkles without throwing
  it('should fall back to Sparkles icon for unknown icon names', () => {
    const insights: AIInsight[] = [
      { id: '1', icon: 'UnknownIcon', text: 'This has an unknown icon' },
    ];
    render(<AIInsights insights={insights} />);

    expect(screen.getByText('This has an unknown icon')).toBeDefined();
    // getAllByTestId because Sparkles is used both in header and as fallback icon
    const sparklesIcons = screen.getAllByTestId('icon-sparkles');
    expect(sparklesIcons.length).toBeGreaterThanOrEqual(2);
  });
});
