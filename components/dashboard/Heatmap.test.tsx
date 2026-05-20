import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Heatmap from './Heatmap';

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', async () => {
  const React = await import('react');
  const MotionDiv = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    (props, ref) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
      const { viewport, whileInView, initial, animate, exit, transition, ...rest } = props as any;
      return <div ref={ref} {...rest} />;
    }
  );
  MotionDiv.displayName = 'MotionDiv';

  return {
    motion: { div: MotionDiv },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

describe('Heatmap', () => {
  it('renders a fallback UI when data is empty', () => {
    render(<Heatmap data={[]} />);

    // Check for the header
    expect(screen.getByText('Contribution Heatmap')).toBeDefined();

    // Check for the fallback text
    expect(screen.getByText('No recent activity to display.')).toBeDefined();
  });
});
