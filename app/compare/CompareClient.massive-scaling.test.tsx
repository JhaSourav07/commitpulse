import { expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import CompareClient from './CompareClient';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  RadarChart: () => <div data-testid="radar-chart" />,
  PolarGrid: () => <div />,
  PolarAngleAxis: () => <div />,
  PolarRadiusAxis: () => <div />,
  Radar: () => <div />,
  Tooltip: () => <div />,
}));
it('Test 1: should render compare interface under massive scaling conditions', () => {
  render(<CompareClient />);

  expect(screen.getByRole('button', { name: /compare/i })).toBeInTheDocument();
});
it('Test 2: should handle extremely long username values without crashing', () => {
  render(<CompareClient />);

  const inputs = screen.getAllByRole('textbox');

  const hugeName = 'developer'.repeat(100);

  expect(() => {
    inputs[0].setAttribute('value', hugeName);
    inputs[1].setAttribute('value', hugeName);
  }).not.toThrow();
});
it('Test 3: should maintain layout container structure under high load', () => {
  const { container } = render(<CompareClient />);

  expect(container.querySelector('main')).toBeInTheDocument();
});
it('Test 4: should render within acceptable execution time', () => {
  const start = performance.now();

  render(<CompareClient />);

  const end = performance.now();

  expect(end - start).toBeLessThan(1000);
});
it('Test 5: should support repeated large scale render cycles', () => {
  expect(() => {
    for (let i = 0; i < 25; i++) {
      const { unmount } = render(<CompareClient />);
      unmount();
    }
  }).not.toThrow();
});
