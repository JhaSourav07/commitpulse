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

describe('CustomMetricCard Responsive Breakpoints', () => {
  it('renders correctly on small mobile viewports', () => {
    window.innerWidth = 375;
    render(<CustomMetricCard />);
    expect(screen.getByTestId('custom-metric-card')).toBeDefined();
  });

  it('renders correctly on desktop viewports', () => {
    window.innerWidth = 1280;
    render(<CustomMetricCard />);
    expect(screen.getByTestId('custom-metric-card')).toBeDefined();
  });
});
