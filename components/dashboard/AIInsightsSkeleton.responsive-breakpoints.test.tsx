import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AIInsightsSkeleton from './AIInsightsSkeleton';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AIInsightsSkeleton - Responsive Multi-device Columns & Mobile Viewport Layouts', () => {
  it('renders a flex-col container ensuring insight rows reflow into a vertical list on narrow viewports', () => {
    const { container } = render(<AIInsightsSkeleton />);

    // flex-col forces vertical stacking — prevents horizontal overflow on 375px viewports
    const flexColContainer = container.querySelector('.flex.flex-col.gap-6');
    expect(flexColContainer).toBeInTheDocument();

    // Must contain exactly 3 insight rows stacked vertically
    expect(flexColContainer?.children.length).toBe(3);
  });

  it('applies overflow-hidden on the root card preventing horizontal scrollbars on small screens', () => {
    const { container } = render(<AIInsightsSkeleton />);

    // overflow-hidden on the wrapper clips any content that would otherwise
    // cause a horizontal scrollbar on narrow mobile viewports
    const root = container.firstElementChild;
    expect(root).toHaveClass('overflow-hidden');
    expect(root).toHaveClass('rounded-xl');
  });

  it('uses only relative width classes — no absolute pixel widths that cause layout overflow', () => {
    const { container } = render(<AIInsightsSkeleton />);

    // Collect all inline style width values — there must be none (all widths are Tailwind classes)
    const allElements = Array.from(container.querySelectorAll('*'));
    const absoluteWidthElements = allElements.filter((el) => {
      const style = (el as HTMLElement).style.width;
      return style && style.includes('px');
    });

    expect(absoluteWidthElements.length).toBe(0);

    // Relative Tailwind width classes must be present instead
    expect(container.querySelector('.w-full')).toBeInTheDocument();
    expect(container.querySelector('.w-4\\/5')).toBeInTheDocument();
  });

  it('applies shrink-0 to icon placeholders so they do not compress on narrow mobile viewports', () => {
    const { container } = render(<AIInsightsSkeleton />);

    // Icons inside each insight row must carry shrink-0 — prevents icon compression
    // when the row is constrained to a 375px viewport width
    const shrinkElements = container.querySelectorAll('.shrink-0');
    expect(shrinkElements.length).toBe(3);

    // Each shrink-0 element must also carry w-4 and h-4 — fixed icon size
    shrinkElements.forEach((el) => {
      expect(el).toHaveClass('w-4');
      expect(el).toHaveClass('h-4');
    });
  });

  it('renders correctly when window.innerWidth is stubbed to a mobile viewport of 375px', () => {
    vi.stubGlobal('innerWidth', 375);
    vi.stubGlobal('innerHeight', 812);

    render(<AIInsightsSkeleton />);

    // ARIA role and label must remain intact at mobile viewport dimensions
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByLabelText('Loading AI Insights')).toBeInTheDocument();

    // aria-busy must still be true — loading state must not change at narrow widths
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');

    // flex-1 on text containers ensures they fill available space without overflowing
    const flexOnes = document.querySelectorAll('.flex-1');
    expect(flexOnes.length).toBe(3);
  });
});
