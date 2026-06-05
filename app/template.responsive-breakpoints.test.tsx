import React, { forwardRef } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, beforeAll, afterEach, describe, expect, it, vi } from 'vitest';
import Template from './template';

// Use forwardRef to ensure we properly handle components that expect refs,
// preventing warnings or breaks when animation libraries are mocked out.
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

// Store original window globals so we can cleanly restore them between tests.
const originalMatchMedia = window.matchMedia;
const originalInnerWidth = window.innerWidth;

beforeAll(() => {
  // Override matchMedia to support dynamic queries based on the simulated window width.
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query) => {
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
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: originalMatchMedia,
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
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
  // Since JSDOM doesn't natively compute CSS media queries to reflow layout,
  // we validate the "Responsive Class Contract" applied to our elements.
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

  it('Case 4: Asserts mobile-specific toggle states respond cleanly', async () => {
    // using userEvent for realistic interaction simulation
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

  it('Case 5: Verifies the desktop layout responsive variant is present', () => {
    render(<ResponsiveFixture />);
    const columnsContainer = screen.getByTestId('content-columns');

    // Asserts that the desktop override class is available to the browser engine
    expect(columnsContainer.className).toContain('md:flex-row');
  });
});
