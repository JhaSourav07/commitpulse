/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import StatsCard from './StatsCard';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => {
      delete props.initial;
      delete props.whileInView;
      delete props.viewport;
      delete props.whileHover;
      delete props.transition;

      return (
        <div className={className} {...props}>
          {children}
        </div>
      );
    },
  },
}));

describe('StatsCard UTC disclaimer', () => {
  it('renders a clean UTC disclaimer prefix and preserves the UTC date text', () => {
    const { container } = render(
      <StatsCard
        title="Current Streak"
        value="12"
        description="Consecutive contribution days"
        icon="Flame"
        showUTCDisclaimer
        utcDate="2026-06-01"
      />
    );

    expect(container.textContent).toContain('ℹ');
    expect(container.textContent).not.toContain('\u00E2\u20AC\u2039');
    expect(container.textContent).toContain('UTC Date: 2026-06-01');
  });
});
