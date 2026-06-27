import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import CompareClient from './CompareClient';
import React, { type ReactNode } from 'react';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(() => null),
  }),
}));

vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: (_, tag) => {
        return ({
          children,
          animate,
          initial,
          exit,
          transition,
          variants,
          whileHover,
          whileTap,
          whileFocus,
          whileDrag,
          whileInView,
          layout,
          layoutId,
          ...props
        }: {
          children?: ReactNode;
          [key: string]: unknown;
        }) => React.createElement(tag as string, props, children);
      },
    }
  ),
  AnimatePresence: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  RadarChart: () => <div data-testid="radar-chart" />,
  Radar: () => <div />,
  PolarGrid: () => <div />,
  PolarAngleAxis: () => <div />,
  PolarRadiusAxis: () => <div />,
  Tooltip: () => <div />,
}));

describe('ComparePage Theme Contrast (Variation 3)', () => {
  it('renders heading with dark and light text contrast classes', () => {
    render(<CompareClient />);

    const heading = screen.getByRole('heading', {
      name: /compare developers/i,
    });

    expect(heading).toHaveClass('text-gray-900');
    expect(heading).toHaveClass('dark:text-white');
  });

  it('renders username input fields with dark and light theme styling', () => {
    render(<CompareClient />);

    const user1 = screen.getByPlaceholderText(/github username #1/i);
    const user2 = screen.getByPlaceholderText(/github username #2/i);

    expect(user1).toHaveClass('bg-white');
    expect(user1).toHaveClass('dark:bg-[#0a0a0a]');
    expect(user1).toHaveClass('text-gray-900');
    expect(user1).toHaveClass('dark:text-white');

    expect(user2).toHaveClass('bg-white');
    expect(user2).toHaveClass('dark:bg-[#0a0a0a]');
    expect(user2).toHaveClass('text-gray-900');
    expect(user2).toHaveClass('dark:text-white');
  });

  it('renders compare button with proper contrast classes for both themes', () => {
    render(<CompareClient />);

    const compareButton = screen.getByRole('button', {
      name: /compare/i,
    });

    expect(compareButton).toHaveClass('bg-black');
    expect(compareButton).toHaveClass('dark:bg-white');
    expect(compareButton).toHaveClass('text-white');
    expect(compareButton).toHaveClass('dark:text-black');
  });

  it('applies border contrast styling to form controls', () => {
    render(<CompareClient />);

    const user1 = screen.getByPlaceholderText(/github username #1/i);

    expect(user1).toHaveClass('border-black/10');
    expect(user1).toHaveClass('dark:border-[rgba(255,255,255,0.1)]');
  });

  it('renders decorative badge with theme-aware background styling', () => {
    render(<CompareClient />);

    const badge = screen.getByText(/developer showdown/i);

    const container = badge.parentElement;

    expect(container).toHaveClass('bg-gray-100');
    expect(container).toHaveClass('dark:bg-[#111]');
    expect(container).toHaveClass('border-black/10');
    expect(container).toHaveClass('dark:border-[rgba(255,255,255,0.1)]');
  });
});
