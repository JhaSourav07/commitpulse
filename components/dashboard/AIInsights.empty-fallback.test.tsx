/* eslint-disable @typescript-eslint/no-explicit-any */
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

  it('renders with an empty insights array', () => {
    render(<AIInsights insights={[]} />);

    expect(screen.getByText('AI Insights')).toBeDefined();
  });

  it('renders only the header sparkles icon when insights array is empty', () => {
    render(<AIInsights insights={[]} />);

    const sparklesIcons = screen.getAllByTestId('icon-sparkles');
    expect(sparklesIcons).toHaveLength(1);
  });

  it('renders heading when insights is undefined', () => {
    render(<AIInsights insights={undefined as unknown as AIInsight[]} />);

    expect(screen.getByText('AI Insights')).toBeDefined();
  });

  it('renders heading when insights is null', () => {
    render(<AIInsights insights={null as unknown as AIInsight[]} />);

    expect(screen.getByText('AI Insights')).toBeDefined();
  });

  it('renders only the header sparkles icon when insights is undefined', () => {
    render(<AIInsights insights={undefined as unknown as AIInsight[]} />);

    expect(screen.getByText('AI Insights')).toBeDefined();
    expect(screen.getAllByTestId('icon-sparkles')).toHaveLength(1);
  });
});
