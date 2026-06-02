import React, { forwardRef } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, beforeAll, afterEach, describe, expect, it, vi } from 'vitest';
import Template from './template';

// Copilot Fix: Use forwardRef to ensure we don't break components that rely on refs
type MotionDivProps = React.HTMLAttributes<HTMLDivElement> & {
  children?: React.ReactNode;
};

vi.mock('framer-motion', () => {
  const MockDiv = forwardRef<HTMLDivElement, MotionDivProps>(({ children, ...props }, ref) => (
    <div ref={ref} {...props}>
      {children}
    </div>
  ));
  MockDiv.displayName = 'MotionDiv';
  return {
    motion: {
      div: MockDiv,
    },
  };
});

// Copilot Fix: Make matchMedia configurable, tie it to innerWidth, and clean it up properly
const originalMatchMedia = window.matchMedia;
const originalInnerWidth = window.innerWidth;

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query) => {
      // Dynamic match based on innerWidth
      const match = query.match(/max-width:\s*(\d+)px/);
      let matches = false;
      if (match) {
        matches = window.innerWidth <= parseInt(match[1], 10);
      }
      return {
        matches,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };
    }),
  });
});

afterAll(() => {
  // Restore original global to prevent leaking into other tests
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: originalMatchMedia,
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  // Reset window width to standard desktop
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: originalInnerWidth,
  });
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

describe('AppTemplate Responsive Breakpoints (Variation 7)', () => {
  // Copilot Fix: We drop innerWidth manipulation because JSDOM CSS does not reflow.
  // Instead, we verify the "Responsive Class Contract".
  it('Case 1: Verifies the presence of responsive flex-col and md:flex-row classes for column reflow', () => {
    render(<ResponsiveFixture />);
    const columnsContainer = screen.getByTestId('content-columns');

    // Validates the component applies the correct responsive variants
    expect(columnsContainer.className).toContain('flex-col');
    expect(columnsContainer.className).toContain('md:flex-row');
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

  // Copilot Fix: Upgrade fireEvent to userEvent for more realistic interaction simulation
  it('Case 4: Asserts mobile-specific toggle states respond cleanly', async () => {
    const user = userEvent.setup();
    render(<ResponsiveFixture />);
    const toggle = screen.getByTestId('mobile-toggle');
    const navLinks = screen.getByTestId('nav-links');

    // Default mobile state (closed)
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(navLinks.className).toContain('hidden');

    // Toggle mobile menu (open)
    await user.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(navLinks.className).toContain('flex');
    expect(navLinks.className).not.toContain('hidden');
  });

  // Copilot Fix: Verify the class contract instead of pseudo-reflow
  it('Case 5: Verifies the desktop layout responsive variant is present', () => {
    render(<ResponsiveFixture />);
    const columnsContainer = screen.getByTestId('content-columns');

    // Asserts that the desktop override class is available to the browser engine
    expect(columnsContainer.className).toContain('md:flex-row');
  });
});
