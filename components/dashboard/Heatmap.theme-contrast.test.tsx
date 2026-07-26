import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import type { ReactNode, HTMLAttributes } from 'react';
import Heatmap from './Heatmap';
import type { ActivityData } from '@/types/dashboard';

beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

vi.mock('framer-motion', () => ({
  motion: {
    div: (props: HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) => (
      <div
        className={props.className}
        style={props.style}
        onMouseEnter={props.onMouseEnter}
        onMouseLeave={props.onMouseLeave}
      >
        {props.children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));

describe('Heatmap Theme Contrast', () => {
  const mockData: ActivityData[] = [
    {
      date: '2025-01-01',
      count: 5,
      intensity: 2,
    },
  ];

  it('renders the themed heatmap card container', () => {
    render(<Heatmap data={mockData} />);

    expect(
      screen.getByRole('heading', {
        name: /contribution heatmap/i,
      })
    ).toBeInTheDocument();
  });

  it('renders the heatmap heading in themed layouts', () => {
    render(<Heatmap data={mockData} />);

    expect(screen.getByTestId('heatmap-heading')).toBeInTheDocument();
  });

  it('renders heading with contrast-aware text classes', () => {
    render(<Heatmap data={mockData} />);

    const heading = screen.getByRole('heading', {
      name: /contribution heatmap/i,
    });

    expect(heading.className).toContain('text-gray-900');
    expect(heading.className).toContain('dark:text-white');
  });

  it('preserves readable legend labels in themed layouts', () => {
    render(<Heatmap data={mockData} />);

    expect(screen.getByText('Less')).toBeInTheDocument();
    expect(screen.getByText('More')).toBeInTheDocument();

    const subtitle = screen.getByText(/last 365 days/i);

    expect(subtitle.className).toContain('text-[#A1A1AA]');
  });

  it('applies theme-aware empty-state styling', () => {
    render(<Heatmap data={[]} />);

    expect(screen.getByText(/no recent activity to display/i)).toBeInTheDocument();

    const emptyState = screen.getByTestId('heatmap-empty-state');

    expect(emptyState).toBeInTheDocument();
    expect(emptyState).toHaveTextContent(/no recent activity to display/i);
  });
});
