import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { ReactNode } from 'react';
import { SuccessGuide } from './SuccessGuide';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children: ReactNode }) => <div {...props}>{children}</div>,
  },
}));

vi.mock('./Icons', () => ({
  CloseIcon: () => <span>CloseIcon</span>,
}));

const originalInnerWidth = window.innerWidth;
const originalMatchMedia = window.matchMedia;

function mockViewport(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => {
      let matches = false;
      const minWidthMatch = query.match(/\(min-width:\s*(\d+)px\)/);
      const maxWidthMatch = query.match(/\(max-width:\s*(\d+)px\)/);

      if (minWidthMatch) {
        matches = width >= parseInt(minWidthMatch[1], 10);
      } else if (maxWidthMatch) {
        matches = width <= parseInt(maxWidthMatch[1], 10);
      }

      return {
        matches,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };
    }),
  });
}

afterEach(() => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: originalInnerWidth,
  });
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: originalMatchMedia,
  });
});

describe('SuccessGuide Responsive Breakpoints', () => {
  const markdown = '![badge](https://example.com/badge.svg)';

  it('Case 1: Mock a narrow 375px mobile viewport layout configuration and verify that structural grid/column blocks reflow cleanly into single-column or vertical flex setups', () => {
    mockViewport(375);
    const onDismiss = vi.fn();

    render(<SuccessGuide markdown={markdown} onDismiss={onDismiss} />);

    const stepsContainer = screen.getByLabelText('Steps to embed your badge');
    const classes = stepsContainer.className.split(/\s+/);
    expect(classes).toContain('grid');
    expect(classes).toContain('sm:grid-cols-2');
    expect(classes).not.toContain('grid-cols-2');
    expect(classes).not.toContain('grid-cols-3');

    const stepWrappers = stepsContainer.children;
    expect(stepWrappers.length).toBe(4);
    for (let i = 0; i < stepWrappers.length; i++) {
      const stepWrapper = stepWrappers[i];
      expect(stepWrapper.className).toContain('flex');
    }
  });

  it('Case 2: Inspect rendering boundaries to ensure that visual component containers avoid fixed absolute widths that cause horizontal overflow scrolling on compact display windows', () => {
    mockViewport(375);
    const onDismiss = vi.fn();

    render(<SuccessGuide markdown={markdown} onDismiss={onDismiss} />);

    const region = screen.getByRole('region');
    expect(region.style.width).toBe('');
    expect(region.className).toContain('overflow-hidden');
    expect(region.className).not.toContain('w-[');

    const outerContainer = region.parentElement;
    expect(outerContainer?.className).toContain('max-w-4xl');
    expect(outerContainer?.className).not.toContain('w-[');

    const codeSnippet = screen.getByLabelText('Your badge markdown snippet');
    expect(codeSnippet.className).toContain('break-all');
    expect(codeSnippet.className).toContain('overflow-x-auto');
  });

  it('Case 3: Verify that sub-navigation blocks, form fields, and icons collapse or scale down gracefully while preserving clear target interactive space limits', () => {
    mockViewport(375);
    const onDismiss = vi.fn();

    render(<SuccessGuide markdown={markdown} onDismiss={onDismiss} />);

    const dismissBtn = screen.getByRole('button', { name: /dismiss guide/i });
    expect(dismissBtn.className).toContain('shrink-0');
    expect(dismissBtn.className).toContain('p-2');

    const steps = ['01', '02', '03', '04'];
    steps.forEach((num) => {
      const badge = screen.getByText(num);
      expect(badge.className).toContain('shrink-0');
      expect(badge.className).toContain('w-9');
      expect(badge.className).toContain('h-9');
    });
  });

  it('Case 4: Simulate a mobile viewport to confirm that mobile-specific visibility states, toggle interactions, or responsive layout components respond smoothly with no exceptions', () => {
    mockViewport(375);
    const onDismiss = vi.fn();

    render(<SuccessGuide markdown={markdown} onDismiss={onDismiss} />);

    const dismissBtn = screen.getByRole('button', { name: /dismiss guide/i });
    fireEvent.click(dismissBtn);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('Case 5: Verify that resizing the viewport across responsive boundaries triggers updates correctly without causing structural state drops or component mount unmount hydration failure hooks', () => {
    const onDismiss = vi.fn();

    mockViewport(1024);
    const { rerender } = render(<SuccessGuide markdown={markdown} onDismiss={onDismiss} />);

    expect(screen.getByRole('region')).toBeInTheDocument();
    expect(screen.getByLabelText('Steps to embed your badge')).toBeInTheDocument();

    mockViewport(375);
    window.dispatchEvent(new Event('resize'));

    rerender(<SuccessGuide markdown={markdown} onDismiss={onDismiss} />);

    expect(screen.getByRole('region')).toBeInTheDocument();
    expect(screen.getByLabelText('Steps to embed your badge')).toBeInTheDocument();

    mockViewport(1440);
    window.dispatchEvent(new Event('resize'));

    rerender(<SuccessGuide markdown={markdown} onDismiss={onDismiss} />);

    expect(screen.getByRole('region')).toBeInTheDocument();
    expect(screen.getByLabelText('Steps to embed your badge')).toBeInTheDocument();
  });
});
