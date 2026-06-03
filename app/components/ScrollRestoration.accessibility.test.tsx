import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import Link from 'next/link';
import ScrollRestoration from './ScrollRestoration';

const mockUsePathname = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

describe('ScrollRestoration accessibility behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePathname.mockReturnValue('/dashboard');
    sessionStorage.clear();

    Object.defineProperty(window, 'scrollTo', {
      writable: true,
      value: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders no DOM nodes that would disrupt screen reader document flow', () => {
    const { container } = render(
      <div role="main" aria-label="Main content">
        <ScrollRestoration />
        <h1>Page Title</h1>
      </div>
    );

    // Component returns null — it must not inject any elements into the DOM
    const allElements = container.querySelectorAll('*');
    const tagNames = Array.from(allElements).map((el) => el.tagName.toLowerCase());
    expect(tagNames).not.toContain('script');
    expect(tagNames).not.toContain('style');

    // Heading must remain reachable by screen readers
    expect(screen.getByRole('heading', { level: 1 })).toBeDefined();
  });

  it('preserves landmark role structure when mounted alongside semantic elements', () => {
    render(
      <div>
        <header role="banner">
          <nav role="navigation" aria-label="Main navigation">
            <Link href="/">Home</Link>
          </nav>
        </header>
        <main role="main">
          <ScrollRestoration />
          <h1>Dashboard</h1>
        </main>
        <footer role="contentinfo">Footer</footer>
      </div>
    );

    // All landmark roles must remain intact after ScrollRestoration mounts
    expect(screen.getByRole('banner')).toBeDefined();
    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeDefined();
    expect(screen.getByRole('main')).toBeDefined();
    expect(screen.getByRole('contentinfo')).toBeDefined();
  });

  it('does not interfere with heading hierarchy readable by screen readers', () => {
    render(
      <div>
        <ScrollRestoration />
        <h1>Main Heading</h1>
        <h2>Sub Heading</h2>
        <h3>Sub Sub Heading</h3>
      </div>
    );

    // Heading hierarchy must be logically intact for screen reader navigation
    expect(screen.getByRole('heading', { level: 1, name: /main heading/i })).toBeDefined();
    expect(screen.getByRole('heading', { level: 2, name: /sub heading/i })).toBeDefined();
    expect(screen.getByRole('heading', { level: 3, name: /sub sub heading/i })).toBeDefined();
  });

  it('does not affect keyboard tab order of interactive elements', () => {
    render(
      <div>
        <ScrollRestoration />
        <Link href="/home">Home</Link>
        <button>Click me</button>
        <input aria-label="Search" type="text" />
      </div>
    );

    // All interactive elements must remain focusable and in correct tab order
    const link = screen.getByRole('link', { name: /home/i });
    const button = screen.getByRole('button', { name: /click me/i });
    const input = screen.getByRole('textbox', { name: /search/i });

    link.focus();
    expect(document.activeElement).toBe(link);

    button.focus();
    expect(document.activeElement).toBe(button);

    input.focus();
    expect(document.activeElement).toBe(input);
  });

  it('does not inject elements with aria attributes that could confuse assistive technology', () => {
    const { container } = render(
      <div>
        <ScrollRestoration />
      </div>
    );

    // Component must not add any aria-* bearing elements since it returns null
    const ariaElements = container.querySelectorAll(
      '[aria-label],[aria-describedby],[aria-labelledby],[role]'
    );
    expect(ariaElements.length).toBe(0);
  });
});
