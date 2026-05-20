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
vi.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: {
      div: React.forwardRef((props: any, ref: any) => {
        const { viewport, whileInView, initial, animate, exit, transition, ...rest } = props;
        return <div ref={ref} {...rest} />;
      }),
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
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
