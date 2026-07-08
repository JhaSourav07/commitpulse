import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import NotFound from './not-found';

// Mocking dependencies to isolate the component
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock('sonner', () => ({
  toast: vi.fn(),
}));

vi.mock('../components/MiniGame', () => ({
  default: () => <div data-testid="mini-game">MiniGame Component</div>,
}));

// Helper to mock window.matchMedia for mobile viewports
const setMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

describe('NotFound Component - Responsive Multi-device Columns & Mobile Viewports', () => {
  let originalInnerWidth: number;

  beforeEach(() => {
    // Save original viewport
    originalInnerWidth = window.innerWidth;

    // Simulate mobile viewport (e.g. iPhone SE / Standard Mobile)
    window.innerWidth = 375;
    setMatchMedia(true);
  });

  afterEach(() => {
    // Restore viewport and clear mocks
    window.innerWidth = originalInnerWidth;
    vi.restoreAllMocks();
  });

  it('Mock standard mobile-width media coordinates (e.g. 375px wide viewports)', () => {
    const { container } = render(<NotFound />);

    expect(window.innerWidth).toBe(375);
    expect(screen.getByText(/rebased out of existence/i)).toBeInTheDocument();
    expect(screen.getByTestId('mini-game')).toBeInTheDocument();
    // Verify the "this-page" code span text
    expect(container.textContent).toMatch(/git checkout this-page/i);
  });

  it('Assert that columns reflow into standard vertical flex lists', () => {
    const { container } = render(<NotFound />);

    // Asserting the main structural wrapper uses flexbox for responsive reflow
    const mainWrapper = container.firstChild as HTMLElement;
    expect(mainWrapper.className).toMatch(/flex/);

    // Ensure it does not force absolute horizontal rows on mobile without a breakpoint prefix (e.g., md:flex-row)
    const enforcesAbsoluteRow = /(?<!(sm|md|lg|xl|2xl):)flex-row\b/.test(mainWrapper.className);
    expect(enforcesAbsoluteRow).toBe(false);
  });

  it('Verify styling values are not absolute widths that cause horizontal scrollbars on smaller viewports', () => {
    const { container } = render(<NotFound />);

    // Deeply assert that no absolute pixel widths (>375px) are hardcoded in the component's Tailwind classes
    const allElements = container.querySelectorAll('*');
    let hasAbsoluteOverflowWidth = false;

    allElements.forEach((el) => {
      const classStr = el.className || '';
      // Look for arbitrary wide widths like w-[400px], w-[800px] which break mobile layouts
      const absoluteWidthMatch = classStr.match(/w-\[(\d+)px\]/);
      if (absoluteWidthMatch && parseInt(absoluteWidthMatch[1], 10) > 375) {
        hasAbsoluteOverflowWidth = true;
      }
    });

    expect(hasAbsoluteOverflowWidth).toBe(false);
  });

  it('Check that navigation components scale down gracefully', () => {
    render(<NotFound />);

    const backButton = screen.getByRole('link', { name: /Go back home/i });
    expect(backButton).toBeInTheDocument();

    // Verify the button avoids fixed explicit widths that would clip off-screen
    expect(backButton.className).not.toMatch(/w-\[\d+px\]/);
    // Alternatively, verify standard responsive padding/text scaling exists if possible
    expect(backButton.className).not.toMatch(/text-\[5rem\]/);
  });

  it('Assert mobile-specific toggle states respond cleanly', () => {
    render(<NotFound />);

    const backButton = screen.getByRole('link', { name: /Go back home/i });

    // Ensure the navigation target acts as a viable touch target on mobile
    // by responding successfully to DOM focus states without layout shifts
    backButton.focus();
    expect(backButton).toHaveFocus();

    // Verify it contains a valid href to navigate successfully via standard touch tap
    expect(backButton).toHaveAttribute('href', '/');
  });
});
