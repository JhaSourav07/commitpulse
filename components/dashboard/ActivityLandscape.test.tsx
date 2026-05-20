import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ActivityLandscape from './ActivityLandscape';

// Mock framer-motion
vi.mock('framer-motion', async () => {
  const React = await import('react');
  const MotionDiv = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((props, ref) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
    const { viewport, whileInView, initial, animate, exit, transition, ...rest } = props as any;
    return <div ref={ref} {...rest} />;
  });
  MotionDiv.displayName = 'MotionDiv';

  return {
    motion: { div: MotionDiv },
  };
});

describe('ActivityLandscape', () => {
  it('renders a fallback UI when data is empty', () => {
    render(<ActivityLandscape data={[]} />);

    // Check for the header
    expect(screen.getByText('Activity Landscape')).toBeDefined();

    // Check for the fallback text
    expect(screen.getByText('No recent activity to display.')).toBeDefined();
  });
});
