import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ActivityLandscape from './ActivityLandscape';

// Mock framer-motion
vi.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: {
      div: React.forwardRef((props: any, ref: any) => {
        const { viewport, whileInView, initial, animate, exit, transition, ...rest } = props;
        return <div ref={ref} {...rest} />;
      }),
    },
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
