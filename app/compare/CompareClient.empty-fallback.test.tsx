/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CompareClient from './CompareClient';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn().mockReturnValue(null),
  }),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => {
      delete props.initial;
      delete props.animate;
      delete props.exit;
      delete props.whileInView;
      delete props.whileHover;
      delete props.whileTap;
      delete props.whileHover;
      delete props.whileInView;
      delete props.viewport;
      delete props.transition;
      return <div className={className}>{children}</div>;
    },
    button: ({ children, className, onClick, disabled, ...props }: any) => {
      delete props.initial;
      delete props.animate;
      delete props.whileHover;
      delete props.whileTap;
      delete props.whileHover;
      delete props.whileInView;
      delete props.transition;
      return (
        <button className={className} onClick={onClick} disabled={disabled}>
          {children}
        </button>
      );
    },
  },
  AnimatePresence: ({ children }: any) => children,
}));

vi.mock('recharts', () => ({
  Radar: () => null,
  RadarChart: () => null,
  PolarGrid: () => null,
  PolarAngleAxis: () => null,
  PolarRadiusAxis: () => null,
  ResponsiveContainer: ({ children }: any) => children,
  Tooltip: () => null,
}));

describe('CompareClient empty fallback', () => {
  it('renders input fields with empty values by default', () => {
    render(<CompareClient />);
    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBeGreaterThanOrEqual(2);
    inputs.forEach((input) => {
      expect((input as HTMLInputElement).value).toBe('');
    });
  });

  it('renders compare button in default state', () => {
    render(<CompareClient />);
    const button = screen.getByRole('button', { name: /compare/i });
    expect(button).toBeDefined();
    expect(button.textContent).toContain('Compare');
  });

  it('does not render results section when no data is present', () => {
    render(<CompareClient />);
    expect(screen.queryByText('Stats Showdown')).toBeNull();
    expect(screen.queryByText('Language Breakdown')).toBeNull();
  });

  it('does not show error message on initial empty render', () => {
    render(<CompareClient />);
    expect(screen.queryByText('Please enter both usernames.')).toBeNull();
  });

  it('renders page heading in empty state', () => {
    render(<CompareClient />);
    expect(screen.getByText('Compare Developers')).toBeDefined();
  });
});
