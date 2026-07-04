import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DashboardError from './error';
import '@testing-library/jest-dom';

vi.mock('@/lib/logger', () => ({
  default: {
    error: vi.fn(),
  },
}));

describe('DashboardError - Responsive Breakpoints Layout Cohesion', () => {
  const mockError = new Error('Test error message');
  const mockReset = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    window.innerWidth = 375;
    window.dispatchEvent(new Event('resize'));
  });

  it('Case 1: mocks standard mobile-width media coordinates correctly', () => {
    render(<DashboardError error={mockError} reset={mockReset} />);
    expect(window.innerWidth).toBe(375);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Something went wrong' })
    ).toBeInTheDocument();
  });

  it('Case 2: asserts that container layout elements reflow into standard vertical flex lists', () => {
    const { container } = render(<DashboardError error={mockError} reset={mockReset} />);

    // Outer container flex direction is column
    const mainContainer = container.firstElementChild;
    expect(mainContainer).toHaveClass('flex');
    expect(mainContainer).toHaveClass('flex-col');
    expect(mainContainer).toHaveClass('items-center');
    expect(mainContainer).toHaveClass('justify-center');

    // Inner button controls container flex direction is column
    const btnContainer = container.querySelector('.flex-col.gap-3');
    expect(btnContainer).toBeInTheDocument();
  });

  it('Case 3: verifies that styling values use flexible widths rather than absolute widths to prevent horizontal scrollbars on smaller viewports', () => {
    const { container } = render(<DashboardError error={mockError} reset={mockReset} />);

    const cardElement = container.querySelector('.w-full');
    expect(cardElement).toBeInTheDocument();
    expect(cardElement).toHaveClass('max-w-md');

    // Make sure there are no absolute width styling values that might clip small viewports (e.g. w-[500px])
    expect(cardElement).not.toHaveClass('w-[500px]');
  });

  it('Case 4: checks that navigation components/buttons scale down gracefully on mobile screens', () => {
    render(<DashboardError error={mockError} reset={mockReset} />);

    const tryAgainBtn = screen.getByRole('button', { name: /try again/i });
    const goHomeBtn = screen.getByRole('button', { name: /go back home/i });

    expect(tryAgainBtn).toHaveClass('w-full');
    expect(goHomeBtn).toHaveClass('w-full');
  });

  it('Case 5: asserts viewport changes do not affect reset interaction response', () => {
    render(<DashboardError error={mockError} reset={mockReset} />);

    // Resize viewport to large desktop screen
    window.innerWidth = 1440;
    window.dispatchEvent(new Event('resize'));

    expect(window.innerWidth).toBe(1440);

    const tryAgainBtn = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(tryAgainBtn);

    expect(mockReset).toHaveBeenCalledTimes(1);
  });
});
