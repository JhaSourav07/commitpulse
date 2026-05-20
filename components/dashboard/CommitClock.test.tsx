import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CommitClock from './CommitClock';

// Mock framer-motion
vi.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: {
      div: React.forwardRef((props: any, ref: any) => {
        const { viewport, whileInView, initial, animate, exit, transition, ...rest } = props;
        return <div ref={ref} {...rest} />;
      }),
      g: React.forwardRef((props: any, ref: any) => {
        const { viewport, whileInView, initial, animate, exit, transition, ...rest } = props;
        return <g ref={ref} {...rest} />;
      }),
    },
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
