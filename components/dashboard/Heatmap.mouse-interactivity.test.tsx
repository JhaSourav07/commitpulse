import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Heatmap from './Heatmap';
import type { ActivityData } from '@/types/dashboard';

// Mock TranslationContext to return translation keys or formatted fallback strings
vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, string>) => {
      if (options?.count && options?.date) {
        return `${options.count} contributions on ${options.date}`;
      }
      return key;
    },
  }),
}));

// Mock VisualizationTooltip component for precise inspection during tests
vi.mock('./VisualizationTooltip', () => ({
  default: ({
    title,
    children,
    x,
    y,
  }: {
    title: string;
    children: React.ReactNode;
    x: number;
    y: number;
  }) => (
    <div role="tooltip" data-testid="visualization-tooltip" data-x={x} data-y={y}>
      <div>{title}</div>
      {children}
    </div>
  ),
}));

// Mock ResizeObserver which is used inside Heatmap.tsx
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('Heatmap Mouse Interactivity & Touch Event Propagation', () => {
  const mockData: ActivityData[] = [
    { date: '2026-06-01', count: 5, intensity: 3 },
    { date: '2026-06-02', count: 0, intensity: 0 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test 1: Tooltip display & computed coordinates on mouseenter / hover
  it('displays tooltip with computed coordinates on mouseenter over a grid cell', async () => {
    render(<Heatmap data={mockData} />);

    const gridCell = screen.getAllByRole('gridcell')[0];

    // Mock bounding rectangle for coordinate calculations
    vi.spyOn(gridCell, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      top: 200,
      width: 14,
      height: 14,
      right: 114,
      bottom: 214,
      x: 100,
      y: 200,
      toJSON: () => {},
    });

    await userEvent.hover(gridCell);

    const tooltip = screen.getByTestId('visualization-tooltip');
    expect(tooltip).toBeInTheDocument();

    // Check calculated tooltip coordinates (x = 100 + 14/2 = 107, y = 200 - 10 = 190)
    expect(tooltip).toHaveAttribute('data-x', '107');
    expect(tooltip).toHaveAttribute('data-y', '190');
    // formatTooltipDate formats '2026-06-01' -> 'Jun 1, 2026'
    expect(tooltip).toHaveTextContent('5 contributions on Jun 1, 2026');
  });

  // Test 2: Hide tooltip on mouseleave
  it('hides the temporary tooltip visual overlay on mouseleave', async () => {
    render(<Heatmap data={mockData} />);

    const gridCell = screen.getAllByRole('gridcell')[0];

    await userEvent.hover(gridCell);
    expect(screen.getByTestId('visualization-tooltip')).toBeInTheDocument();

    await userEvent.unhover(gridCell);
    expect(screen.queryByTestId('visualization-tooltip')).not.toBeInTheDocument();
  });

  // Test 3: Cursor styles and interactive feedback classes
  it('applies interactive cursor classes (cursor-pointer) and focus styles to grid cells', () => {
    render(<Heatmap data={mockData} />);

    const gridCell = screen.getAllByRole('gridcell')[0];

    expect(gridCell).toHaveClass('cursor-pointer');
    expect(gridCell).toHaveClass('hover:scale-125');
  });

  // Test 4: Focus and Blur interactivity (Keyboard/Touch Accessibility)
  it('shows and hides tooltip on focus and blur events for accessibility', () => {
    render(<Heatmap data={mockData} />);

    const gridCell = screen.getAllByRole('gridcell')[0];

    fireEvent.focus(gridCell);
    expect(screen.getByTestId('visualization-tooltip')).toBeInTheDocument();

    fireEvent.blur(gridCell);
    expect(screen.queryByTestId('visualization-tooltip')).not.toBeInTheDocument();
  });

  // Test 5: Touch gesture and event propagation on cell interaction
  it('handles touch/click gesture propagation without throwing errors', () => {
    const handleClick = vi.fn();

    render(
      <div onClick={handleClick}>
        <Heatmap data={mockData} />
      </div>
    );

    const gridCell = screen.getAllByRole('gridcell')[0];

    // Trigger touchStart event
    fireEvent.touchStart(gridCell, {
      touches: [{ clientX: 105, clientY: 205 }],
    });

    // Trigger click to check propagation to parent containers
    fireEvent.click(gridCell);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
