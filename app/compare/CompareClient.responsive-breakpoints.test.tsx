import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import React, { type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

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

vi.doMock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  RadarChart: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  Radar: () => <div />,
  PolarGrid: () => <div />,
  PolarAngleAxis: () => <div />,
  PolarRadiusAxis: () => <div />,
  Tooltip: () => <div />,
}));

async function renderCompareClient() {
  const { default: CompareClient } = await import('./CompareClient');

  return render(<CompareClient />);
}

describe('CompareClient responsive breakpoints', () => {
  it('renders mobile friendly input controls', async () => {
    await renderCompareClient();

    expect(screen.getByPlaceholderText(/github username #1/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/github username #2/i)).toBeInTheDocument();
  });

  it('renders compare button for small viewport interactions', async () => {
    await renderCompareClient();

    expect(screen.getByRole('button', { name: /compare/i })).toBeInTheDocument();
  });

  it('uses responsive container spacing classes', async () => {
    const { container } = await renderCompareClient();

    expect(container.querySelector('.px-4.sm\\:px-6')).toBeTruthy();
  });

  it('uses responsive layout grid classes', async () => {
    const { container } = await renderCompareClient();

    expect(container.querySelector('.flex-col.sm\\:flex-row')).toBeTruthy();
  });

  it('contains responsive typography classes for mobile scaling', async () => {
    const { container } = await renderCompareClient();

    expect(container.querySelector('.text-3xl.sm\\:text-4xl')).toBeTruthy();
  });
});
