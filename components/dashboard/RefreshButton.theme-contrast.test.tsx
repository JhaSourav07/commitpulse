import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RefreshButton from './RefreshButton';

const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockRefresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    refresh: mockRefresh,
  }),
  useSearchParams: () => ({
    get: vi.fn(() => null),
    toString: vi.fn(() => ''),
  }),
}));

vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'dashboard.refresh_btn': 'Refresh',
        'dashboard.refreshing': 'Refreshing...',
        'dashboard.refreshed_toast': 'Dashboard refreshed',
      };
      return translations[key] || key;
    },
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
  },
}));

describe('RefreshButton Theme Contrast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('applies dark mode border contrast styling', () => {
    render(<RefreshButton username="octocat" />);

    const button = screen.getByRole('button');

    expect(button.className).toContain('dark:border-[rgba(255,255,255,0.15)]');
  });

  it('applies dark mode text contrast styling', () => {
    render(<RefreshButton username="octocat" />);

    const button = screen.getByRole('button');

    expect(button.className).toContain('dark:text-white');
    expect(button.className).toContain('dark:bg-black');
  });

  it('applies light mode contrast styling', () => {
    render(<RefreshButton username="octocat" />);

    const button = screen.getByRole('button');

    expect(button.className).toContain('border-black/10');
    expect(button.className).toContain('bg-black');
    expect(button.className).toContain('text-white');
  });

  it('includes theme-specific hover states', () => {
    render(<RefreshButton username="octocat" />);

    const button = screen.getByRole('button');

    expect(button.className).toContain('hover:bg-gray-800');
    expect(button.className).toContain('dark:hover:bg-white/10');
  });

  it('includes disabled-state visual accessibility styling', () => {
    render(<RefreshButton username="octocat" />);

    const button = screen.getByRole('button');

    expect(button.className).toContain('disabled:opacity-50');
    expect(button.className).toContain('disabled:cursor-not-allowed');
  });
});
