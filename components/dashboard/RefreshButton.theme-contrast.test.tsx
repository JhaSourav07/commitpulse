import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import RefreshButton from './RefreshButton';

const { pushMock, replaceMock, refreshMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  replaceMock: vi.fn(),
  refreshMock: vi.fn(),
}));

let searchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
    refresh: refreshMock,
  }),
  useSearchParams: () => searchParams,
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
  },
}));

vi.mock('lucide-react', () => ({
  RefreshCw: ({ size, className }: { size?: number; className?: string }) => (
    <svg data-testid="refresh-icon" data-size={String(size)} className={className} />
  ),
}));

describe('RefreshButton - Theme Contrast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParams = new URLSearchParams();
  });

  it('renders button with dark and light theme background classes', () => {
    render(<RefreshButton username="kanishka" />);

    const button = screen.getByRole('button');

    expect(button.className).toContain('bg-black');
    expect(button.className).toContain('dark:bg-black');
  });

  it('renders text color classes for both themes', () => {
    render(<RefreshButton username="kanishka" />);

    const button = screen.getByRole('button');

    expect(button.className).toContain('text-white');
    expect(button.className).toContain('dark:text-white');
  });

  it('renders border classes for theme contrast', () => {
    render(<RefreshButton username="kanishka" />);

    const button = screen.getByRole('button');

    expect(button.className).toContain('border');
    expect(button.className).toContain('border-black/10');
    expect(button.className).toContain('dark:border-[rgba(255,255,255,0.15)]');
  });

  it('renders hover styling classes for both themes', () => {
    render(<RefreshButton username="kanishka" />);

    const button = screen.getByRole('button');

    expect(button.className).toContain('hover:bg-gray-800');
    expect(button.className).toContain('dark:hover:bg-white/10');
  });

  it('renders refresh icon and button text correctly', () => {
    render(<RefreshButton username="kanishka" />);

    expect(screen.getByTestId('refresh-icon')).toBeInTheDocument();
    expect(screen.getByText('Refresh Data')).toBeInTheDocument();

    expect(
      screen.getByRole('button', {
        name: /refresh dashboard contribution data/i,
      })
    ).toBeInTheDocument();
  });
});
