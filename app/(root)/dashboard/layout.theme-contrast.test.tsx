import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import DashboardLayout from './layout';

vi.mock('sonner', () => ({
  Toaster: () => <div data-testid="toaster" />,
}));

afterEach(() => {
  cleanup();
});

describe('DashboardLayout theme-contrast: Dark and Light Prefers-Color-Scheme Visual Cohesion', () => {
  it('applies light mode text color class for sufficient contrast on light backgrounds', () => {
    const { container } = render(
      <DashboardLayout>
        <p>Dashboard content</p>
      </DashboardLayout>
    );

    const root = container.firstChild as HTMLElement;

    // text-gray-900 ensures sufficient contrast in light mode
    expect(root.className).toContain('text-gray-900');
  });

  it('applies dark mode text color class for sufficient contrast on dark backgrounds', () => {
    const { container } = render(
      <DashboardLayout>
        <p>Dashboard content</p>
      </DashboardLayout>
    );

    const root = container.firstChild as HTMLElement;

    // dark:text-white ensures sufficient contrast in dark mode
    expect(root.className).toContain('dark:text-white');
  });

  it('uses a transparent background so it does not clip foreground content colors in either theme', () => {
    const { container } = render(
      <DashboardLayout>
        <p>Dashboard content</p>
      </DashboardLayout>
    );

    const root = container.firstChild as HTMLElement;

    // bg-transparent allows parent theme background to show through without clipping content
    expect(root.className).toContain('bg-transparent');
  });

  it('renders children content correctly within the themed main wrapper', () => {
    render(
      <DashboardLayout>
        <p>Dashboard content</p>
      </DashboardLayout>
    );

    // Children must render visibly regardless of theme
    expect(screen.getByText('Dashboard content')).toBeDefined();
  });

  it('renders the Toaster component for theme-aware notification styling', () => {
    render(
      <DashboardLayout>
        <p>Dashboard content</p>
      </DashboardLayout>
    );

    // Toaster (sonner) must render so notifications adapt to both themes
    expect(screen.getByTestId('toaster')).toBeDefined();
  });
});
