import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import AchievementsSkeleton from './AchievementsSkeleton';

describe('AchievementsSkeleton accessibility', () => {
  it('renders the achievements skeleton container', () => {
    const { container } = render(<AchievementsSkeleton />);

    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders four decorative loading cells', () => {
    render(<AchievementsSkeleton />);

    expect(screen.getAllByTestId('skeleton-cell')).toHaveLength(4);
  });

  it('keeps skeleton cells non-focusable for keyboard users', () => {
    render(<AchievementsSkeleton />);

    screen.getAllByTestId('skeleton-cell').forEach((cell) => {
      expect(cell).not.toHaveAttribute('tabindex');
    });
  });

  it('does not expose decorative cells as interactive controls', () => {
    render(<AchievementsSkeleton />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('does not create incorrect heading hierarchy during loading state', () => {
    render(<AchievementsSkeleton />);

    expect(screen.queryAllByRole('heading')).toHaveLength(0);
  });
});
