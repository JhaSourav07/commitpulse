import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import AchievementsSkeleton from './AchievementsSkeleton';

describe('AchievementsSkeleton - Empty/Missing Inputs Verification', () => {
  it('renders successfully without props', () => {
    const { container } = render(<AchievementsSkeleton />);

    expect(container.firstChild).not.toBeNull();
  });

  it('does not throw runtime errors during render', () => {
    expect(() => render(<AchievementsSkeleton />)).not.toThrow();
  });

  it('renders fallback skeleton cells', () => {
    render(<AchievementsSkeleton />);

    const cells = screen.getAllByTestId('skeleton-cell');

    expect(cells).toHaveLength(4);
  });

  it('maintains default grid layout styling', () => {
    const { container } = render(<AchievementsSkeleton />);

    const grid = container.querySelector('.grid-cols-2');

    expect(grid).toBeTruthy();
  });

  it('renders expected DOM markers in empty state', () => {
    render(<AchievementsSkeleton />);

    const cells = screen.getAllByTestId('skeleton-cell');

    cells.forEach((cell) => {
      expect(cell).toBeTruthy();
      expect(cell.classList.contains('shimmer')).toBe(true);
    });
  });
});
