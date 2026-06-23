import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import StatsCardSkeleton from './StatsCardSkeleton';

describe('StatsCardSkeleton Accessibility', () => {
  it('renders without exposing any ARIA roles on the outer container', () => {
    const { container } = render(<StatsCardSkeleton />);

    // The outermost element is a plain div with no semantic role assigned.
    // Skeleton loaders are presentational, so no role should be present.
    const outerDiv = container.firstElementChild as HTMLElement;
    expect(outerDiv).toBeInTheDocument();
    expect(outerDiv).not.toHaveAttribute('role');
  });

  it('has no invalid or broken aria-labelledby references', () => {
    render(<StatsCardSkeleton />);

    // No element in this component uses aria-labelledby.
    const elementsWithLabelledby = screen
      .queryAllByRole('generic')
      .filter((el) => el.hasAttribute('aria-labelledby'));
    expect(elementsWithLabelledby).toHaveLength(0);
  });

  it('has no invalid or broken aria-describedby references', () => {
    render(<StatsCardSkeleton />);

    // No element in this component uses aria-describedby.
    const allElements = document.querySelectorAll('[aria-describedby]');
    expect(allElements).toHaveLength(0);
  });

  it('does not expose any interactive elements (buttons, links, inputs, etc.)', () => {
    render(<StatsCardSkeleton />);

    // Skeleton loaders should not expose interactive controls.
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByRole('combobox')).toBeNull();
    expect(screen.queryByRole('slider')).toBeNull();
    expect(screen.queryByRole('tab')).toBeNull();
    expect(screen.queryByRole('menuitem')).toBeNull();
  });

  it('does not incorrectly expose headings, status regions, or progress indicators', () => {
    render(<StatsCardSkeleton />);

    // The component is purely visual shimmer placeholders — no headings or semantic regions.
    expect(screen.queryByRole('heading')).toBeNull();
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(screen.queryByRole('region')).toBeNull();
  });
});
