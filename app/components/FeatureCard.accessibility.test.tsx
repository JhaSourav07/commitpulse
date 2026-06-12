import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { FeatureCard } from './FeatureCard';

type MockMotionProps = {
  children?: React.ReactNode;
  className?: string;
  [key: string]: unknown;
};

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: MockMotionProps) => <div {...props}>{children}</div>,
  },
}));

const TestIcon = () => <svg data-testid="test-icon" aria-label="feature icon" />;

const defaultProps = {
  icon: <TestIcon />,
  title: 'Zero Config',
  desc: 'Drop in your username and go. No tokens, no setup.',
  accent: 'text-emerald-400',
};

describe('FeatureCard — Accessibility & Screen Reader Compliance', () => {
  it('renders card as an article landmark labeled by its heading', () => {
    render(<FeatureCard {...defaultProps} />);

    const article = screen.getByRole('article', {
      name: 'Zero Config',
    });

    expect(article).toBeInTheDocument();
  });

  it('links card to title and description via aria-labelledby and aria-describedby', () => {
    const { container } = render(<FeatureCard {...defaultProps} />);

    const titleId = 'feature-title-zero-config';
    const descId = 'feature-desc-zero-config';

    const article = container.querySelector(`[aria-labelledby="${titleId}"]`);
    expect(article).toBeInTheDocument();

    const descEl = container.querySelector(`[aria-describedby="${descId}"]`);
    expect(descEl).toBeInTheDocument();

    expect(container.querySelector(`#${titleId}`)).toHaveTextContent('Zero Config');
    expect(container.querySelector(`#${descId}`)).toHaveTextContent(
      'Drop in your username and go. No tokens, no setup.'
    );
  });

  it('renders title inside an h3 heading for correct heading hierarchy', () => {
    render(<FeatureCard {...defaultProps} />);

    const heading = screen.getByRole('heading', { level: 3 });

    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('Zero Config');
  });

  it('hides decorative icon from screen readers via aria-hidden', () => {
    const { container } = render(<FeatureCard {...defaultProps} />);

    const iconWrapper = container.querySelector('[aria-hidden="true"]');
    expect(iconWrapper).toBeInTheDocument();

    const icon = container.querySelector('[data-testid="test-icon"]');
    expect(iconWrapper).toContainElement(icon as HTMLElement);
    expect(iconWrapper).toHaveAttribute('aria-hidden', 'true');
  });

  it('keeps description text visible and accessible to screen readers', () => {
    render(<FeatureCard {...defaultProps} />);

    const desc = screen.getByText('Drop in your username and go. No tokens, no setup.');

    expect(desc).toBeInTheDocument();
    expect(desc).not.toHaveAttribute('aria-hidden');
  });
});
