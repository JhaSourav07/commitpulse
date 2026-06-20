import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import AIInsights from './AIInsights';
import type { AIInsight } from '@/types/dashboard';

import type { HTMLAttributes } from 'react';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

vi.mock('lucide-react', () => ({
  Sparkles: (props: Record<string, unknown>) => <div data-testid="icon-sparkles" {...props} />,
  Moon: (props: Record<string, unknown>) => <div data-testid="icon-moon" {...props} />,
  Sun: (props: Record<string, unknown>) => <div data-testid="icon-sun" {...props} />,
  Zap: (props: Record<string, unknown>) => <div data-testid="icon-zap" {...props} />,
  Calendar: (props: Record<string, unknown>) => <div data-testid="icon-calendar" {...props} />,
  Flame: (props: Record<string, unknown>) => <div data-testid="icon-flame" {...props} />,
  Code: (props: Record<string, unknown>) => <div data-testid="icon-code" {...props} />,
  Star: (props: Record<string, unknown>) => <div data-testid="icon-star" {...props} />,
  LucideIcon: () => null,
}));

vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('AIInsights Error Resilience & Robustness', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles insights with missing id field gracefully', () => {
    const badInsights = [{ icon: 'Zap', text: 'Insight without id' }] as unknown as AIInsight[];
    render(<AIInsights insights={badInsights} />);
    expect(screen.getByText('Insight without id')).toBeInTheDocument();
  });

  it('handles insights with missing text field without crashing', () => {
    const badInsights = [{ id: '1', icon: 'Zap' }] as unknown as AIInsight[];
    render(<AIInsights insights={badInsights} />);
    expect(screen.getByText('dashboard.insights.title')).toBeInTheDocument();
  });

  it('handles insights with unknown icon key by falling back to Sparkles', () => {
    const badInsights = [
      { id: '1', icon: 'NonExistentIcon', text: 'Unknown icon test' },
    ] as unknown as AIInsight[];
    render(<AIInsights insights={badInsights} />);
    const sparkles = screen.getAllByTestId('icon-sparkles');
    expect(sparkles.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Unknown icon test')).toBeInTheDocument();
  });

  it('handles insights with empty string icon gracefully', () => {
    const badInsights = [
      { id: '1', icon: '', text: 'Insight with empty icon' },
    ] as unknown as AIInsight[];
    render(<AIInsights insights={badInsights} />);
    expect(screen.getByText('Insight with empty icon')).toBeInTheDocument();
    const sparkles = screen.getAllByTestId('icon-sparkles');
    expect(sparkles.length).toBeGreaterThanOrEqual(2);
  });

  it('handles insights with undefined icon gracefully', () => {
    const badInsights = [{ id: '1', text: 'Insight with no icon' }] as unknown as AIInsight[];
    render(<AIInsights insights={badInsights} />);
    expect(screen.getByText('Insight with no icon')).toBeInTheDocument();
    const sparkles = screen.getAllByTestId('icon-sparkles');
    expect(sparkles.length).toBeGreaterThanOrEqual(2);
  });
});
