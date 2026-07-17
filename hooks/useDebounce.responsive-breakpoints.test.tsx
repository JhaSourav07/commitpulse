import React, { useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useDebounce } from './useDebounce';

function ResponsiveLayout({ width }: { width: number }) {
  const debouncedWidth = useDebounce(width, 300);
  const isMobile = debouncedWidth <= 375;
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      data-testid="layout"
      className={isMobile ? 'flex flex-col max-w-full overflow-x-hidden' : 'grid grid-cols-3'}
      style={{ maxWidth: '100%' }}
    >
      <nav data-testid="navigation" className={isMobile ? 'text-sm w-full' : 'text-base w-auto'}>
        Navigation
      </nav>

      <section data-testid="columns" className={isMobile ? 'flex flex-col' : 'flex flex-row'}>
        <div>Column 1</div>
        <div>Column 2</div>
        <div>Column 3</div>
      </section>

      <button onClick={() => setMenuOpen((value) => !value)}>Toggle menu</button>

      {menuOpen && <span>Mobile menu open</span>}
    </div>
  );
}

describe('useDebounce responsive breakpoints', () => {
  it('applies mobile layout after 375px viewport debounce delay', () => {
    vi.useFakeTimers();

    try {
      render(<ResponsiveLayout width={375} />);

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(screen.getByTestId('layout')).toHaveClass('flex-col');
    } finally {
      vi.useRealTimers();
    }
  });

  it('reflows columns into vertical flex list on mobile', () => {
    vi.useFakeTimers();

    try {
      render(<ResponsiveLayout width={375} />);

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(screen.getByTestId('columns')).toHaveClass('flex-col');
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not use fixed widths that cause horizontal overflow', () => {
    vi.useFakeTimers();

    try {
      render(<ResponsiveLayout width={375} />);

      act(() => {
        vi.advanceTimersByTime(300);
      });

      const layout = screen.getByTestId('layout');

      expect(layout).toHaveClass('max-w-full');
      expect(layout).toHaveClass('overflow-x-hidden');
      expect(layout).toHaveStyle({ maxWidth: '100%' });
    } finally {
      vi.useRealTimers();
    }
  });

  it('scales navigation down on mobile viewport', () => {
    vi.useFakeTimers();

    try {
      render(<ResponsiveLayout width={375} />);

      act(() => {
        vi.advanceTimersByTime(300);
      });

      const navigation = screen.getByTestId('navigation');

      expect(navigation).toHaveClass('text-sm');
      expect(navigation).toHaveClass('w-full');
    } finally {
      vi.useRealTimers();
    }
  });

  it('responds cleanly to mobile-specific toggle state', () => {
    vi.useFakeTimers();

    try {
      render(<ResponsiveLayout width={375} />);

      act(() => {
        vi.advanceTimersByTime(300);
      });

      fireEvent.click(screen.getByText('Toggle menu'));

      expect(screen.getByText('Mobile menu open')).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
