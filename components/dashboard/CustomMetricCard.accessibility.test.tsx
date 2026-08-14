/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import CustomMetricCard from './CustomMetricCard';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...rest }: any) => <div {...rest}>{children}</div>,
    button: ({ children, ...rest }: any) => <button {...rest}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('CustomMetricCard Accessibility', () => {
  it('provides accessible form labels for filter controls', () => {
    render(<CustomMetricCard />);
    expect(screen.getByLabelText(/Date Range Filter/i)).toBeDefined();
    expect(screen.getByLabelText(/Filter by Keyword\/Tag/i)).toBeDefined();
  });

  it('sets aria-pressed attributes correctly on metric preset selection buttons', () => {
    render(<CustomMetricCard />);
    const velocityBtn = screen.getByRole('button', { name: /Commit Velocity/i });
    const impactBtn = screen.getByRole('button', { name: /Code Impact Ratio/i });

    expect(velocityBtn.getAttribute('aria-pressed')).toBe('true');
    expect(impactBtn.getAttribute('aria-pressed')).toBe('false');
  });
});
