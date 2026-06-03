import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ThemeToggleButton } from './theme-switch';
import '@testing-library/jest-dom';

describe('ThemeSwitch - Timezone Boundaries & Calendar Alignment', () => {
  beforeEach(() => {
    // 1. Reset document classes
    document.documentElement.className = '';

    // 2. Clear localStorage
    window.localStorage.clear();

    // 3. Mock matchMedia to handle prefers-reduced-motion checks safely
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    vi.restoreAllMocks();
  });

  // --- Test Case 1 ---
  it('renders theme toggle button successfully in UTC timezone', () => {
    // Mock UTC offset (0 minutes)
    vi.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(0);

    render(<ThemeToggleButton />);

    const button = screen.getByRole('button', { name: /toggle theme/i });
    expect(button).toBeInTheDocument();
  });

  // --- Test Case 2 ---
  it('resolves initial theme state correctly when system timezone is set to EST', () => {
    // EST is UTC-5, so timezoneOffset is 300 minutes
    vi.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(300);

    render(<ThemeToggleButton />);

    // Default initial theme is dark, so 'dark' class should be on document element
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  // --- Test Case 3 ---
  it('toggles dark and light mode state safely in JST timezone', () => {
    // JST is UTC+9, so timezoneOffset is -540 minutes
    vi.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(-540);

    render(<ThemeToggleButton />);

    const button = screen.getByRole('button', { name: /toggle theme/i });
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    // Trigger theme toggle click inside act() to prevent warning
    act(() => {
      button.click();
    });

    // It should safely toggle to light mode (removing 'dark' class)
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  // --- Test Case 4 ---
  it('handles hydration and mounting check safely during leap year boundary dates', () => {
    // Freeze time on Leap Day (Feb 29)
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-02-29T12:00:00Z'));

    render(<ThemeToggleButton />);

    const button = screen.getByRole('button', { name: /toggle theme/i });
    expect(button).toBeInTheDocument();

    vi.useRealTimers();
  });

  // --- Test Case 5 ---
  it('retains consistent layout styling classes in Indian Standard Time (IST)', () => {
    // IST is UTC+5:30, so timezoneOffset is -330 minutes
    vi.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(-330);

    render(<ThemeToggleButton />);

    const button = screen.getByRole('button', { name: /toggle theme/i });

    // Assert structural classes are preserved
    expect(button).toHaveClass('inline-flex');
    expect(button).toHaveClass('h-10');
    expect(button).toHaveClass('w-10');
    expect(button).toHaveClass('rounded-xl');
  });
});
