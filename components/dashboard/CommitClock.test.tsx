import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CommitClock from './CommitClock';

// Mock framer-motion
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

  const MotionG = React.forwardRef<SVGGElement, React.SVGAttributes<SVGGElement>>((props, ref) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
    const { viewport, whileInView, initial, animate, exit, transition, ...rest } = props as any;
    return <g ref={ref} {...rest} />;
  });
  MotionG.displayName = 'MotionG';

  return {
    motion: { div: MotionDiv, g: MotionG },
  };
});

describe('CommitClock', () => {
  it('renders a fallback UI when data is empty array', () => {
    render(<CommitClock data={[]} />);

    // Check for the header
    expect(screen.getByText('Commit Clock')).toBeDefined();

    // Check for the fallback text
    expect(screen.getByText('No commit activity yet.')).toBeDefined();
  });

  it('renders a fallback UI when all commits are 0', () => {
    const emptyData = Array.from({ length: 24 }, (_, i) => ({ hour: i, commits: 0 }));
    render(<CommitClock data={emptyData} />);

    expect(screen.getByText('No commit activity yet.')).toBeDefined();
  });
});
