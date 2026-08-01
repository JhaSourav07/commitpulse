import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FeatureCard } from './FeatureCard';

import type { HTMLAttributes, PropsWithChildren } from 'react';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

describe('FeatureCard Responsive Breakpoints & Mobile Viewport Layouts', () => {
  const defaultProps = {
    icon: <svg data-testid="feature-icon" />,
    title: 'Fast Performance',
    desc: 'Optimized for speed and responsiveness.',
    accent: 'bg-emerald-500/20',
  };

  it('1. renders the feature card with article semantics and accessible labels', () => {
    render(<FeatureCard {...defaultProps} />);

    const article = screen.getByRole('article');

    expect(article).toBeInTheDocument();
    expect(article).toHaveAttribute('aria-labelledby', 'feature-title-fast-performance');
    expect(article).toHaveAttribute('aria-describedby', 'feature-desc-fast-performance');
  });

  it('2. applies responsive typography for mobile viewports', () => {
    render(<FeatureCard {...defaultProps} />);

    const heading = screen.getByRole('heading', {
      name: /Fast Performance/i,
    });

    expect(heading).toHaveClass('max-md:text-sm');
  });

  it('3. does not use fixed pixel widths that could cause horizontal scrolling', () => {
    const { container } = render(<FeatureCard {...defaultProps} />);

    container.querySelectorAll('[class]').forEach((el) => {
      const classes = el.getAttribute('class') ?? '';

      expect(classes).not.toMatch(/\bw-\[\d+px\]/);
      expect(classes).not.toMatch(/\bmin-w-\[\d+px\]/);
      expect(classes).not.toMatch(/\bmax-w-\[\d+px\]/);
    });
  });

  it('4. keeps the icon container visible and preserves responsive layout classes', () => {
    const { container } = render(<FeatureCard {...defaultProps} />);

    const iconWrapper = container.querySelector('[aria-hidden="true"]');

    expect(iconWrapper).toBeInTheDocument();
    expect(iconWrapper).toHaveClass('w-fit', 'rounded-xl', 'mb-6');

    expect(screen.getByTestId('feature-icon')).toBeInTheDocument();
  });

  it('5. supports hover interaction without affecting layout rendering', () => {
    const { container } = render(<FeatureCard {...defaultProps} />);

    const article = container.querySelector('[role="article"]');

    expect(article).toBeInTheDocument();

    fireEvent.mouseEnter(article!);
    fireEvent.mouseLeave(article!);

    expect(screen.getByRole('heading', { name: /Fast Performance/i })).toBeInTheDocument();
  });
});
