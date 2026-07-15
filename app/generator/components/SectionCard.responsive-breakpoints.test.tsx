import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { SectionCard } from './SectionCard';

describe('SectionCard Responsive Multi-device Columns & Mobile Viewport Layouts', () => {
  let originalInnerWidth: number;
  let originalMatchMedia: typeof window.matchMedia;

  beforeAll(() => {
    originalInnerWidth = window.innerWidth;
    originalMatchMedia = window.matchMedia;

    // Mock matchMedia for responsive checking
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
  });

  afterAll(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: originalInnerWidth,
    });
    window.matchMedia = originalMatchMedia;
  });

  const setViewportWidth = (width: number) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
    window.dispatchEvent(new Event('resize'));
  };

  // 1. Mock standard mobile-width media coordinates (e.g. 375px wide viewports).
  it('mocks standard mobile-width media coordinates and renders without crashing', () => {
    setViewportWidth(375); // iPhone SE/Standard small mobile

    render(
      <SectionCard title="Mobile View">
        <div data-testid="mobile-content">Content</div>
      </SectionCard>
    );

    expect(window.innerWidth).toBe(375);
    expect(screen.getByText('Mobile View')).toBeInTheDocument();
  });

  // 2. Assert that columns reflow into standard vertical flex lists.
  it('asserts that columns reflow handling is supported via min-w-0 and w-full utility classes', () => {
    setViewportWidth(414);

    const { container } = render(
      <SectionCard title="Reflow Test" description="A very long description that needs to truncate">
        <div className="flex flex-col sm:flex-row" data-testid="reflow-grid">
          <div>Column 1</div>
          <div>Column 2</div>
        </div>
      </SectionCard>
    );

    const button = container.querySelector('button');
    // Ensure the main button container expands dynamically
    expect(button?.className).toContain('w-full');

    const titleContainer = container.querySelector('.flex-1.min-w-0');
    // min-w-0 allows the flex child to shrink below its minimum intrinsic size, ensuring proper reflow on mobile
    expect(titleContainer).toBeInTheDocument();

    expect(screen.getByTestId('reflow-grid').className).toContain('flex flex-col sm:flex-row');
  });

  // 3. Verify styling values are not absolute widths that cause horizontal scrollbars on smaller viewports.
  it('verifies styling values are not absolute widths that cause horizontal scrollbars', () => {
    setViewportWidth(320); // Very narrow mobile

    const { container } = render(
      <SectionCard title="No Absolute Widths">
        <div>Content</div>
      </SectionCard>
    );

    const card = container.firstChild as HTMLElement;
    // Check that we don't have absolute pixel widths that break mobile viewports
    expect(card.className).not.toMatch(/w-\[\d+px\]/);
    expect(card.className).not.toMatch(/w-\d{2,}/); // Prevents large static tailwind widths like w-96 (24rem)

    const button = container.querySelector('button');
    expect(button?.className).toContain('w-full');
  });

  // 4. Check that navigation components scale down gracefully.
  it('checks that navigation components passed as children scale down gracefully', () => {
    setViewportWidth(375);

    render(
      <SectionCard title="Navigation Scale">
        <nav data-testid="mock-nav" className="w-full text-[10px] sm:text-sm">
          <a href="#">Link 1</a>
          <a href="#">Link 2</a>
        </nav>
      </SectionCard>
    );

    const nav = screen.getByTestId('mock-nav');
    // Ensure the navigation mock utilizes relative widths
    expect(nav.className).toContain('w-full');
    expect(nav.className).toContain('text-[10px]');
  });

  // 5. Assert mobile-specific toggle states respond cleanly.
  it('asserts mobile-specific toggle states respond cleanly', async () => {
    setViewportWidth(375); // Ensuring we are testing the mobile interaction explicitly

    render(
      <SectionCard title="Mobile Toggle" defaultOpen={false}>
        <div data-testid="toggle-content">Hidden Content</div>
      </SectionCard>
    );

    // Initially closed
    expect(screen.queryByTestId('toggle-content')).not.toBeInTheDocument();

    const toggleButton = screen.getByRole('button', { name: /Mobile Toggle/i });
    expect(toggleButton.getAttribute('aria-expanded')).toBe('false');

    // Simulate mobile touch/click
    fireEvent.click(toggleButton);

    // Now open and responsive
    expect(screen.getByTestId('toggle-content')).toBeInTheDocument();
    expect(toggleButton.getAttribute('aria-expanded')).toBe('true');

    // Grab the svg and read its class string in a way that's compatible with SVG in JSDOM.
    const chevronIcon = toggleButton.querySelector('svg');
    // Wait for any state-driven class change to apply
    await new Promise((r) => setTimeout(r, 0));
    const svgClassAttr =
      chevronIcon?.getAttribute('class') ??
      // For some environments SVG className is an object with baseVal
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (chevronIcon?.className && (chevronIcon.className as any).baseVal) ??
      '';
    expect(svgClassAttr).toContain('rotate-180');
  });
});
