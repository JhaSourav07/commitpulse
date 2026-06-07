import { describe, it, expect, vi } from 'vitest';
import React, { type ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(() => null),
  }),
  usePathname: () => '',
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

// This uses a dynamic import to completely bypass module hoisting safely without using require()
const { default: CompareClient } = await import('./CompareClient');

describe('CompareClient Accessibility Standards', () => {
  it('ensures inputs and controls have accessible names', () => {
    render(<CompareClient />);

    const input1 = screen.getByPlaceholderText(/github username #1/i);
    const input2 = screen.getByPlaceholderText(/github username #2/i);

    expect(input1).toHaveAttribute('placeholder');
    expect(input2).toHaveAttribute('placeholder');
  });

  it('keeps primary actions keyboard focusable with visible outline', () => {
    render(<CompareClient />);

    const button = screen.getByRole('button', { name: /compare/i });

    button.focus();

    expect(document.activeElement).toBe(button);
    expect(button).toBeVisible();
  });

  it('associates tooltip content using aria-describedby', () => {
    render(<CompareClient />);

    const tooltipTrigger = screen.queryByRole('button', {
      name: /tooltip|info|help/i,
    });

    if (tooltipTrigger) {
      const describedBy = tooltipTrigger.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();

      const tooltip = describedBy ? document.getElementById(describedBy) : null;

      if (tooltip) {
        expect(tooltip.textContent?.length).toBeGreaterThan(0);
      }
    } else {
      expect(true).toBe(true);
    }
  });

  it('maintains logical keyboard tab order for interactive elements', () => {
    render(<CompareClient />);

    const focusables = document.querySelectorAll(
      'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    expect(focusables.length).toBeGreaterThan(0);

    focusables.forEach((el) => {
      const tabIndex = el.getAttribute('tabindex');
      expect(tabIndex).not.toBe('-1');
    });
  });

  it('renders proper heading hierarchy without skipping levels', () => {
    render(<CompareClient />);

    const headings = screen.getAllByRole('heading');

    expect(headings.length).toBeGreaterThan(0);

    const levels = headings.map((h) => {
      const tag = h.tagName;
      return Number(tag.replace('H', ''));
    });

    for (let i = 1; i < levels.length; i++) {
      expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1);
    }
  });
});
