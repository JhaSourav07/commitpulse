// components/dashboard/AIInsights.accessibility.test.tsx

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AIInsights from './AIInsights';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('lucide-react', () => ({
  Sparkles: () => <svg aria-hidden="true" data-testid="sparkles-icon" />,
  Moon: () => <svg aria-hidden="true" />,
  Sun: () => <svg aria-hidden="true" />,
  Zap: () => <svg aria-hidden="true" />,
  Calendar: () => <svg aria-hidden="true" />,
  Flame: () => <svg aria-hidden="true" />,
  Code: () => <svg aria-hidden="true" />,
  Star: () => <svg aria-hidden="true" />,
}));

describe('AIInsights Accessibility', () => {
  const insights = [
    {
      id: '1',
      icon: 'Moon',
      text: 'Night productivity increased by 32%',
    },
    {
      id: '2',
      icon: 'Zap',
      text: 'Fastest merge response this week',
    },
  ];

  it('renders a semantic heading for screen readers', () => {
    render(<AIInsights insights={insights} />);

    expect(
      screen.getByRole('heading', {
        name: /dashboard\.insights\.title/i,
      })
    ).toBeTruthy();
  });

  it('renders all insight descriptions as readable text content', () => {
    render(<AIInsights insights={insights} />);

    expect(screen.getByText(/night productivity increased/i)).toBeTruthy();
    expect(screen.getByText(/fastest merge response/i)).toBeTruthy();
  });

  it('marks decorative icons as aria-hidden for assistive technologies', () => {
    render(<AIInsights insights={insights} />);

    const icons = screen.getAllByTestId('sparkles-icon');
    expect(icons[0]).toHaveAttribute('aria-hidden', 'true');
  });

  it('preserves logical content order for keyboard and screen reader flow', () => {
    render(<AIInsights insights={insights} />);

    const heading = screen.getByRole('heading');
    const firstInsight = screen.getByText(/night productivity increased/i);

    expect(
      heading.compareDocumentPosition(firstInsight) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it('does not render inaccessible interactive controls unexpectedly', () => {
    render(<AIInsights insights={insights} />);

    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByRole('textbox')).toBeNull();
  });
});
