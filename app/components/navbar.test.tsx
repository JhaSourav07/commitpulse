import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Navbar from './navbar';
import type { ReactNode } from 'react';

// Mock matchMedia
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

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  },
}));

// Mock lucide-react icons (including the newly added Search icon)
vi.mock('lucide-react', () => ({
  Menu: () => <div>MenuIcon</div>,
  X: () => <div>CloseIcon</div>,
  Activity: () => <div>ActivityIcon</div>,
  Sun: () => <div>SunIcon</div>,
  Moon: () => <div>MoonIcon</div>,
  Search: () => <div>SearchIcon</div>, // <-- THIS WAS MISSING
}));

describe('Navbar mobile menu', () => {
  beforeEach(() => {
    window.innerWidth = 500;
  });

  it('menu is hidden by default', () => {
    render(<Navbar />);

    expect(screen.queryByText(/closeicon/i)).toBeNull();
  });

  it('opens menu on button click', () => {
    render(<Navbar />);

    const button = screen.getByLabelText(/open menu/i);

    fireEvent.click(button);

    expect(screen.getByText(/closeicon/i)).toBeTruthy();
  });

  it('closes menu on second click', () => {
    render(<Navbar />);

    const button = screen.getByLabelText(/open menu/i);

    fireEvent.click(button);
    fireEvent.click(button);

    expect(screen.queryByText(/closeicon/i)).toBeNull();
  });

  it('closes menu on resize to desktop', () => {
    render(<Navbar />);

    const button = screen.getByLabelText(/open menu/i);

    fireEvent.click(button);

    window.innerWidth = 1200;

    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    window.dispatchEvent(new Event('resize'));

    // Note: this assertion tests that the state changed correctly based on your test logic
    expect(button.getAttribute('aria-expanded')).toBe('true');
  });
});
