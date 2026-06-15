import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DashboardError from './error';

import type { ReactNode } from 'react';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('DashboardError Mouse Interactivity', () => {
  const mockReset = vi.fn();

  const renderComponent = (message = 'Something went wrong') => {
    return render(<DashboardError error={new Error(message)} reset={mockReset} />);
  };

  it('triggers reset when Try again button is clicked', () => {
    renderComponent();

    const button = screen.getByRole('button', {
      name: /try again/i,
    });

    fireEvent.click(button);

    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it('handles mouse enter and mouse leave on Try again button', () => {
    renderComponent();

    const button = screen.getByRole('button', {
      name: /try again/i,
    });

    fireEvent.mouseEnter(button);
    fireEvent.mouseLeave(button);

    expect(button).toBeTruthy();
  });

  it('handles mouse enter and mouse leave on Go back home button', () => {
    renderComponent();

    const button = screen.getByRole('button', {
      name: /go back home/i,
    });

    fireEvent.mouseEnter(button);
    fireEvent.mouseLeave(button);

    expect(button).toBeTruthy();
  });

  it('renders navigation link correctly', () => {
    renderComponent();

    const link = screen.getByRole('link');

    expect(link.getAttribute('href')).toBe('/');
  });

  it('keeps interactive controls visible after mouse interactions', () => {
    renderComponent();

    const retryButton = screen.getByRole('button', {
      name: /try again/i,
    });

    fireEvent.mouseEnter(retryButton);
    fireEvent.mouseMove(retryButton);
    fireEvent.mouseLeave(retryButton);

    expect(
      screen.getByRole('button', {
        name: /try again/i,
      })
    ).toBeTruthy();

    expect(
      screen.getByRole('button', {
        name: /go back home/i,
      })
    ).toBeTruthy();
  });
});
