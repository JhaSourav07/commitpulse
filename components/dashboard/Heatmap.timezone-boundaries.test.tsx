import { render, screen, fireEvent } from '@testing-library/react';
import { it, expect, vi, beforeAll } from 'vitest';
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
      <div {...props}>{props.children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));

it('renders leap day contribution correctly', () => {
  const data: ActivityData[] = [
    {
      date: '2024-02-29',
      count: 5,
      intensity: 2,
    },
  ];

  render(<Heatmap data={data} />);

  expect(screen.getByLabelText(/5 contributions on feb 29, 2024/i)).toBeDefined();
});

it('preserves contribution dates across month boundaries', () => {
  const data: ActivityData[] = [
    { date: '2025-01-31', count: 1, intensity: 1 },
    { date: '2025-02-01', count: 1, intensity: 1 },
  ];

  render(<Heatmap data={data} />);

  expect(screen.getByLabelText(/jan 31, 2025/i)).toBeDefined();

  expect(screen.getByLabelText(/feb 1, 2025/i)).toBeDefined();
});

it('renders daylight savings start date correctly', () => {
  const data: ActivityData[] = [
    {
      date: '2025-03-09',
      count: 2,
      intensity: 2,
    },
  ];

  render(<Heatmap data={data} />);

  expect(screen.getByLabelText(/mar 9, 2025/i)).toBeDefined();
});

it('renders daylight savings end date correctly', () => {
  const data: ActivityData[] = [
    {
      date: '2025-11-02',
      count: 2,
      intensity: 2,
    },
  ];

  render(<Heatmap data={data} />);

  expect(screen.getByLabelText(/nov 2, 2025/i)).toBeDefined();
});

it('shows active streak across calendar boundaries', () => {
  const data: ActivityData[] = [
    { date: '2025-01-31', count: 1, intensity: 1 },
    { date: '2025-02-01', count: 1, intensity: 1 },
    { date: '2025-02-02', count: 1, intensity: 1 },
  ];

  render(<Heatmap data={data} />);

  const cells = screen.getAllByRole('gridcell');

  fireEvent.mouseEnter(cells[1]);

  expect(screen.getByText(/3-day active streak/i)).toBeDefined();
});
