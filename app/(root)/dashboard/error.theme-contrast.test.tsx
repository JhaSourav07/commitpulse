import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import DashboardError from './error';

vi.mock('next/link', () => ({
  default: ({
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { children: React.ReactNode }) => (
    <a {...props}>{children}</a>
  ),
}));

describe('DashboardError Theme Contrast', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    document.documentElement.classList.remove('dark');
  });

  it('renders correctly in light mode', () => {
    render(<DashboardError error={new Error('test error')} reset={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument();
  });

  it('renders correctly in dark mode', () => {
    document.documentElement.classList.add('dark');

    render(<DashboardError error={new Error('test error')} reset={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument();
  });

  it('contains light and dark theme container classes', () => {
    const { container } = render(
      <DashboardError error={new Error('test error')} reset={vi.fn()} />
    );

    const panel = container.querySelector('.bg-white\\/80.border.border-black\\/10');

    expect(panel).toBeInTheDocument();
    expect(panel?.className).toContain('bg-white/80');
    expect(panel?.className).toContain('border-black/10');
    expect(panel?.className).toContain('dark:bg-white/5');
  });

  it('contains contrast-aware heading and description text classes', () => {
    const { container } = render(
      <DashboardError error={new Error('test error')} reset={vi.fn()} />
    );

    const heading = screen.getByRole('heading', {
      name: 'Something went wrong',
    });

    expect(heading.className).toContain('text-gray-900');
    expect(heading.className).toContain('dark:text-white');

    const description = container.querySelector('.text-gray-600.dark\\:text-white\\/70');

    expect(description).toBeInTheDocument();
  });

  it('preserves button contrast classes across themes', () => {
    render(<DashboardError error={new Error('test error')} reset={vi.fn()} />);

    const retryButton = screen.getByRole('button', { name: /try again/i });

    expect(retryButton.className).toContain('bg-black');
    expect(retryButton.className).toContain('text-white');
    expect(retryButton.className).toContain('dark:bg-white/10');
    expect(retryButton.className).toContain('dark:text-white');
  });
});
