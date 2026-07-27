import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { Spinner } from './Spinner';

/**
 * Accessibility guarantees for the loading indicator (issue #2253). A silent
 * spinning icon gives sighted users feedback but leaves screen-reader users
 * with nothing while GitHub data loads; these tests lock in the announced
 * status semantics.
 */
describe('Spinner accessibility', () => {
  it('is a polite live region so it does not interrupt the user', () => {
    render(<Spinner label="Loading" />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  });

  it('marks the decorative icon as aria-hidden', () => {
    const { container } = render(<Spinner />);
    const icon = container.querySelector('svg');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });

  it('always provides text for assistive tech, even when visually hidden', () => {
    render(<Spinner label="Loading achievements" showLabel={false} />);
    expect(screen.getByRole('status')).toHaveAccessibleName(/loading achievements/i);
  });
});
