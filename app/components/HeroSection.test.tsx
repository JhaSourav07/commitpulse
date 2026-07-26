import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HeroSection } from './HeroSection';

vi.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    section: 'section',
    h1: 'h1',
    p: 'p',
  },
}));

describe('HeroSection', () => {
  it('renders the hero heading and content', () => {
    render(<HeroSection />);

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /elevate your contribution story/i,
      })
    ).toBeInTheDocument();
    expect(screen.getByText(/isometric/i).textContent).toMatch(/isometric/i);
  });
});

describe('HeroSection responsive breakpoints', () => {
  const renderAtViewport = (width: number) => {
    window.innerWidth = width;
    window.dispatchEvent(new Event('resize'));

    return render(<HeroSection />);
  };

  it.each([
    { width: 375, label: 'mobile' },
    { width: 768, label: 'tablet' },
    { width: 1280, label: 'desktop' },
  ])('renders full typography and high contrast background values at $label width', ({ width }) => {
    const { container } = renderAtViewport(width);

    const hero = container.firstElementChild;
    const heading = screen.getByRole('heading', {
      level: 1,
      name: /elevate your contribution story/i,
    });

    expect(hero?.className).toContain('bg-[radial-gradient');
    expect(heading.tagName).toBe('H1');
    expect(heading.className).toContain('text-5xl');
    expect(heading.className).toContain('md:text-8xl');
    // ensure strong typography and gradient text rendering
    expect(heading.className).toContain('font-extrabold');
    expect(heading.className).toContain('bg-clip-text');
    expect(heading.className).toContain('text-transparent');
    // ensure gradient color stops remain present
    expect(heading.className).toContain('from-green-500');
    expect(heading.className).toContain('to-purple-600');

    // paragraph text and expected color utility
    expect(screen.getByText(/generate high-fidelity, 3d isometric monoliths/i).className).toContain(
      'text-gray-600'
    );
    expect(screen.getByPlaceholderText(/enter github username/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copy link/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /watch dashboard/i })).toBeInTheDocument();
  });
});

describe('HeroSection responsive rendering and typography (Variation 3)', () => {
  it('renders full typography heading with high contrast gradient', () => {
    render(<HeroSection />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeDefined();
    expect(heading.className).toMatch(/text-5xl|text-8xl|font-extrabold/);
  });

  it('renders all three stat badges', () => {
    render(<HeroSection />);
    expect(screen.getByText(/1,247 Contributions/i)).toBeDefined();
    expect(screen.getByText(/83 Pull Requests/i)).toBeDefined();
    expect(screen.getByText(/214 Commits/i)).toBeDefined();
  });

  it('renders GitHub username input field', () => {
    render(<HeroSection />);
    const input = screen.getByPlaceholderText(/Enter GitHub Username/i);
    expect(input).toBeDefined();
  });

  it('renders Watch Dashboard button', () => {
    render(<HeroSection />);
    const button = screen.getByText(/Watch Dashboard/i);
    expect(button).toBeDefined();
  });

  it('renders Copy Link button', () => {
    render(<HeroSection />);
    const button = screen.getByText(/Copy Link/i);
    expect(button).toBeDefined();
  });

  it('renders descriptive paragraph with professional precision text', () => {
    render(<HeroSection />);
    expect(screen.getByText(/professional precision/i)).toBeDefined();
  });
});

// Variation 2 assertions merged into 'HeroSection responsive breakpoints' above.

describe('HeroSection — responsive rendering and elements (Variation 1)', () => {
  const setupMatchMedia = (width: number) => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => {
        const minMatch = query.match(/\(min-width:\s*(\d+)px\)/);
        const maxMatch = query.match(/\(max-width:\s*(\d+)px\)/);
        // Evaluate both constraints independently so compound queries like
        // "(min-width: 768px) and (max-width: 1023px)" resolve correctly.
        let matches = true;
        if (minMatch) matches = matches && width >= Number(minMatch[1]);
        if (maxMatch) matches = matches && width <= Number(maxMatch[1]);
        if (!minMatch && !maxMatch) matches = false;
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
      })
    );
  };

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('outer container carries the hero region role and aria-label with high-contrast background class', () => {
    setupMatchMedia(1280);
    render(<HeroSection />);
    const region = screen.getByRole('region', { name: /hero section/i });
    expect(region).toBeInTheDocument();
    expect(region.className).toContain('bg-[radial-gradient');
  });

  it('heading has gradient typography classes at desktop width (1280 px)', () => {
    setupMatchMedia(1280);
    render(<HeroSection />);
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1.className).toContain('text-5xl');
    expect(h1.className).toContain('md:text-8xl');
    expect(h1.className).toContain('font-extrabold');
    expect(h1.className).toContain('bg-clip-text');
    expect(h1.className).toContain('text-transparent');
    expect(h1.className).toContain('from-green-500');
    expect(h1.className).toContain('to-purple-600');
  });

  it('heading has gradient typography classes at mobile width (375 px)', () => {
    setupMatchMedia(375);
    render(<HeroSection />);
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1.className).toContain('text-5xl');
    expect(h1.className).toContain('font-extrabold');
    expect(h1.className).toContain('bg-clip-text');
    expect(h1.className).toContain('text-transparent');
  });

  it('dark-mode gradient stops are present alongside light-mode stops in the heading', () => {
    setupMatchMedia(768);
    render(<HeroSection />);
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1.className).toContain('dark:from-green-400');
    expect(h1.className).toContain('dark:via-cyan-400');
    expect(h1.className).toContain('dark:to-purple-500');
  });

  it('renders username textbox and at least two action buttons', () => {
    setupMatchMedia(1280);
    render(<HeroSection />);
    expect(screen.getByRole('textbox', { name: /github username/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(2);
  });
});
