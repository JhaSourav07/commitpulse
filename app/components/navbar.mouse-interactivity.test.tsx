import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Navbar from './navbar';

vi.mock('@/hooks/useKeyboardShortcuts', () => ({
  useKeyboardShortcuts: vi.fn(),
}));

type MatchMediaChangeListener = (event: MediaQueryListEvent) => void;

const animationFrames: FrameRequestCallback[] = [];
let scrollY = 0;

// Navbar closes the mobile menu at the desktop breakpoint, so tests need a
// controllable media query object instead of relying on jsdom defaults.
function mockMatchMedia(initialMatches = false) {
  let matches = initialMatches;
  const listeners = new Set<MatchMediaChangeListener>();

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      get matches() {
        return matches;
      },
      media: query,
      onchange: null,
      addListener: vi.fn((listener: MatchMediaChangeListener) => listeners.add(listener)),
      removeListener: vi.fn((listener: MatchMediaChangeListener) => listeners.delete(listener)),
      addEventListener: vi.fn((event: string, listener: MatchMediaChangeListener) => {
        if (event === 'change') listeners.add(listener);
      }),
      removeEventListener: vi.fn((event: string, listener: MatchMediaChangeListener) => {
        if (event === 'change') listeners.delete(listener);
      }),
      dispatchEvent: vi.fn(),
    })),
  });

  return {
    setMatches(nextMatches: boolean) {
      matches = nextMatches;
      listeners.forEach((listener) =>
        listener({
          matches,
          media: '(min-width: 768px)',
        } as MediaQueryListEvent)
      );
    },
  };
}

// useGlowEffect animates CSS variables through requestAnimationFrame; this
// helper advances those queued frames deterministically in tests.
function flushAnimationFrames(count = 1) {
  for (let i = 0; i < count; i += 1) {
    const frame = animationFrames.shift();
    if (!frame) return;
    frame(i * 16);
  }
}

// The glow handlers live on the rounded shell around the nav, not on <nav>.
function getGlowShell(container: HTMLElement) {
  const shell = container.querySelector('header > div > div') as HTMLDivElement | null;

  if (!shell) {
    throw new Error('Navbar glow shell was not rendered');
  }

  return shell;
}

describe('Navbar - Mouse Interactivity, Hovers & Touch Propagation', () => {
  beforeEach(() => {
    animationFrames.length = 0;
    scrollY = 0;
    mockMatchMedia(false);
    window.localStorage.clear();
    document.documentElement.className = '';
    document.documentElement.style.colorScheme = '';

    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      get: () => scrollY,
    });

    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      animationFrames.push(callback);
      return animationFrames.length;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('activates the interactive glow overlay on mouseenter and cursor movement', () => {
    const { container } = render(<Navbar />);
    const shell = getGlowShell(container);

    // jsdom has no real layout box, so provide one for coordinate math.
    vi.spyOn(shell, 'getBoundingClientRect').mockReturnValue({
      left: 10,
      top: 20,
      width: 200,
      height: 100,
      right: 210,
      bottom: 120,
      x: 10,
      y: 20,
      toJSON: () => ({}),
    } as DOMRect);

    fireEvent.mouseEnter(shell);
    fireEvent.mouseMove(shell, { clientX: 170, clientY: 70 });
    flushAnimationFrames(8);

    expect(shell.style.getPropertyValue('--glow-opacity')).toBe('1');
    expect(shell.style.getPropertyValue('--border-opacity')).toBe('1');
    expect(shell.style.getPropertyValue('--mx')).not.toBe('50%');
  });

  it('positions hover visuals using computed cursor coordinates', () => {
    const { container } = render(<Navbar />);
    const shell = getGlowShell(container);

    // A 100x100 box makes clientX/clientY map directly to percentage targets.
    vi.spyOn(shell, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 100,
      height: 100,
      right: 100,
      bottom: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);

    fireEvent.mouseEnter(shell);
    fireEvent.mouseMove(shell, { clientX: 100, clientY: 25 });
    flushAnimationFrames(12);

    expect(Number.parseFloat(shell.style.getPropertyValue('--mx'))).toBeGreaterThan(80);
    expect(Number.parseFloat(shell.style.getPropertyValue('--my'))).toBeLessThan(50);
    expect(container.querySelector('[style*="radial-gradient"]')).toBeInTheDocument();
  });

  it('propagates click and touch gestures through the mobile menu button', () => {
    const parentClick = vi.fn();

    render(
      <div onClick={parentClick}>
        <Navbar />
      </div>
    );

    const menuButton = screen.getByRole('button', { name: /open menu/i });

    // Touch events should be harmless, while click still opens the menu and bubbles.
    fireEvent.touchStart(menuButton);
    fireEvent.touchEnd(menuButton);
    fireEvent.click(menuButton);

    expect(parentClick).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: /close menu/i })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
  });

  it('applies hover feedback classes to pointer-like interactive navigation elements', () => {
    render(<Navbar />);

    const generatorLink = screen.getByRole('link', { name: /generator/i });
    const themeButton = screen.getAllByRole('button', { name: /toggle theme/i })[0];
    const menuButton = screen.getByRole('button', { name: /open menu/i });

    expect(generatorLink).toHaveClass('transition-all');
    expect(generatorLink.className).toContain('hover:bg-gray-100/80');
    expect(themeButton).toHaveClass('transition-colors');
    expect(menuButton.className).toContain('hover:bg-gray-100');
  });

  it('hides temporary hover overlay visuals on mouseleave', () => {
    const { container } = render(<Navbar />);
    const shell = getGlowShell(container);

    vi.spyOn(shell, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 120,
      height: 60,
      right: 120,
      bottom: 60,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);

    // First prove the overlay became visible, then verify mouseleave hides it.
    fireEvent.mouseEnter(shell);
    fireEvent.mouseMove(shell, { clientX: 90, clientY: 30 });
    flushAnimationFrames(4);
    expect(shell.style.getPropertyValue('--glow-opacity')).toBe('1');

    fireEvent.mouseLeave(shell);
    flushAnimationFrames(1);

    expect(shell.style.getPropertyValue('--glow-opacity')).toBe('0');
    expect(shell.style.getPropertyValue('--border-opacity')).toBe('0');
  });

  it('hides the navbar while scrolling down and reveals it while scrolling up', () => {
    const { container } = render(<Navbar />);
    const header = container.querySelector('header') as HTMLElement;

    expect(header.className).toContain('translate-y-0');
    expect(header.className).toContain('opacity-100');

    scrollY = 180;
    fireEvent.scroll(window);

    expect(header.className).toContain('-translate-y-full');
    expect(header.className).toContain('opacity-0');

    scrollY = 120;
    fireEvent.scroll(window);

    expect(header.className).toContain('translate-y-0');
    expect(header.className).toContain('opacity-100');
  });
});
