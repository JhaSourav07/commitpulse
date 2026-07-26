import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import React, { type ReactNode } from 'react';

const replaceMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: replaceMock,
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
        return ({ children, ...props }: { children?: ReactNode; [key: string]: unknown }) =>
          React.createElement(tag as string, props, children);
      },
    }
  ),
  AnimatePresence: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));
vi.mock('recharts', () => ({
  Radar: () => <div />,
  RadarChart: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  PolarGrid: () => <div />,
  PolarAngleAxis: () => <div />,
  PolarRadiusAxis: () => <div />,
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Tooltip: () => <div />,
}));

import CompareClient from './CompareClient';

describe('CompareClient Theme Contrast', () => {
  it('applies theme contrast classes to heading', () => {
    render(<CompareClient />);

    const heading = screen.getByRole('heading', {
      name: /compare developers/i,
    });

    expect(heading).toBeInTheDocument();
    expect(heading.className).toContain('text-gray-900');
    expect(heading.className).toContain('dark:text-white');
  });
  it('applies light and dark theme classes to first username input', () => {
    render(<CompareClient />);

    const input = screen.getByPlaceholderText(/github username #1/i);

    expect(input.className).toContain('bg-white');
    expect(input.className).toContain('dark:bg-[#0a0a0a]');
    expect(input.className).toContain('text-gray-900');
    expect(input.className).toContain('dark:text-white');
  });

  it('applies light and dark theme classes to second username input', () => {
    render(<CompareClient />);

    const input = screen.getByPlaceholderText(/github username #2/i);

    expect(input.className).toContain('bg-white');
    expect(input.className).toContain('dark:bg-[#0a0a0a]');
    expect(input.className).toContain('text-gray-900');
    expect(input.className).toContain('dark:text-white');
  });

  it('applies contrast classes to compare button', () => {
    render(<CompareClient />);

    const button = screen.getByRole('button', {
      name: /compare/i,
    });

    expect(button).toBeInTheDocument();
    expect(button.className).toContain('bg-black');
    expect(button.className).toContain('dark:bg-white');
    expect(button.className).toContain('text-white');
    expect(button.className).toContain('dark:text-black');
  });

  it('renders developer showdown badge with theme-aware styling', () => {
    render(<CompareClient />);

    const badge = screen.getByText(/developer showdown/i);

    expect(badge).toBeInTheDocument();

    const parent = badge.parentElement;
    expect(parent?.className).toContain('bg-gray-100');
    expect(parent?.className).toContain('dark:bg-[#111]');
  });
});
