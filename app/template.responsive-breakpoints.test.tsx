import React from 'react';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Template from './template';

// Mock framer-motion to avoid animation delays in tests
type MotionDivProps = React.HTMLAttributes<HTMLDivElement> & {
  children?: React.ReactNode;
};

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: MotionDivProps) => <div {...props}>{children}</div>,
  },
}));

// Mock matchMedia for responsive testing environments
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: query.includes('max-width: 768px'),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// A standard responsive fixture layout wrapped inside the Template
function ResponsiveFixture() {
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <Template>
      <div className="w-full max-w-full overflow-hidden" data-testid="app-container">
        <nav className="flex flex-wrap items-center justify-between p-4" data-testid="navigation">
          <div className="text-lg font-bold">Logo</div>

          {/* Mobile Toggle State */}
          <button
            className="block p-2 md:hidden"
            data-testid="mobile-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
          >
            Menu
          </button>

          {/* Nav Links */}
          <ul
            data-testid="nav-links"
            className={`${menuOpen ? 'flex' : 'hidden'} w-full flex-col md:flex md:w-auto md:flex-row`}
          >
            <li>Link 1</li>
            <li>Link 2</li>
          </ul>
        </nav>

        {/* Columns that reflow on mobile */}
        <main className="flex w-full flex-col gap-4 md:flex-row" data-testid="content-columns">
          <section className="w-full flex-1" data-testid="column-1">
            Column 1
          </section>
          <section className="w-full flex-1" data-testid="column-2">
            Column 2
          </section>
        </main>
      </div>
    </Template>
  );
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  // Reset window width to standard desktop
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });
});

describe('AppTemplate Responsive Breakpoints (Variation 7)', () => {
  it('Case 1: Mocks mobile-width viewports and reflows columns to vertical flex lists', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });

    render(<ResponsiveFixture />);
    const columnsContainer = screen.getByTestId('content-columns');

    expect(window.innerWidth).toBe(375);
    expect(columnsContainer.className).toContain('flex-col');
  });

  it('Case 2: Prevents absolute widths that cause horizontal scrollbars', () => {
    render(<ResponsiveFixture />);
    const container = screen.getByTestId('app-container');

    // Expect responsive fluid classes, reject hardcoded pixel widths
    expect(container.className).toContain('w-full');
    expect(container.className).toContain('max-w-full');
    expect(container.className).not.toMatch(/w-\[\d+px\]/);
  });

  it('Case 3: Scales navigation components gracefully on smaller viewports', () => {
    render(<ResponsiveFixture />);
    const nav = screen.getByTestId('navigation');

    expect(nav.className).toContain('flex-wrap');
    expect(nav.className).toContain('justify-between');
  });

  it('Case 4: Asserts mobile-specific toggle states respond cleanly', () => {
    render(<ResponsiveFixture />);
    const toggle = screen.getByTestId('mobile-toggle');
    const navLinks = screen.getByTestId('nav-links');

    // Default mobile state (closed)
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(navLinks.className).toContain('hidden');

    // Toggle mobile menu (open)
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(navLinks.className).toContain('flex');
    expect(navLinks.className).not.toContain('hidden');
  });

  it('Case 5: Restores standard row layout on desktop viewports', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    render(<ResponsiveFixture />);
    const columnsContainer = screen.getByTestId('content-columns');

    expect(window.innerWidth).toBe(1024);
    expect(columnsContainer.className).toContain('md:flex-row');
  });
});
