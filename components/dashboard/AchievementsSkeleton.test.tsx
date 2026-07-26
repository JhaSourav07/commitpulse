import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import AchievementsSkeleton from './AchievementsSkeleton';

describe('AchievementsSkeleton', () => {
  it(' renders without crashing', () => {
    expect(render(<AchievementsSkeleton />));
  });
  it(' renders exactly 4 skeleton cells.', () => {
    render(<AchievementsSkeleton />);
    const cells = screen.getAllByTestId('skeleton-cell');
    expect(cells).toHaveLength(4);
  });
  it('each cell has the shimmer class.', () => {
    render(<AchievementsSkeleton />);
    const cells = screen.getAllByTestId('skeleton-cell');

    cells.forEach((cell) => {
      expect(cell.classList).toContain('shimmer');
    });
  });
  it('uses a grid-cols-2 layout.', () => {
    const { container } = render(<AchievementsSkeleton />);
    expect(container.querySelector('.grid-cols-2')).toBeTruthy();
  });
});
