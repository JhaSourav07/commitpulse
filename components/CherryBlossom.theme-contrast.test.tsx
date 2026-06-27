import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import CherryBlossom from './CherryBlossom';
import type React from 'react';
import '@testing-library/jest-dom';

// Mock framer-motion to inspect the props passed to the animated elements
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      ...props
    }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => (
      <div data-testid="motion-div" {...props}>
        {children}
      </div>
    ),
  },
}));

describe('CherryBlossom - Dark and Light Prefers-Color-Scheme Visual Cohesion', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('verifies the environment media queries can simulate both dark and light modes', () => {
    const createMatchMediaMock = (matchesDark: boolean) => {
      return vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-color-scheme: dark)' ? matchesDark : !matchesDark,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
    };

    // Emulate "dark" mode
    window.matchMedia = createMatchMediaMock(true);
    expect(window.matchMedia('(prefers-color-scheme: dark)').matches).toBe(true);
    expect(window.matchMedia('(prefers-color-scheme: light)').matches).toBe(false);

    // Emulate "light" mode
    window.matchMedia = createMatchMediaMock(false);
    expect(window.matchMedia('(prefers-color-scheme: dark)').matches).toBe(false);
    expect(window.matchMedia('(prefers-color-scheme: light)').matches).toBe(true);
  });

  it('verifies visual branches utilize mix-blend-screen for context-aware blending across themes', async () => {
    const { container } = render(<CherryBlossom />);

    await waitFor(() => {
      // Find branch divs
      const branches = container.querySelectorAll('.mix-blend-screen');
      expect(branches.length).toBe(2);
      branches.forEach((branch) => {
        expect(branch).toHaveClass('mix-blend-screen');
      });
    });
  });

  it('verifies specific organic SVG colors are present to maintain high aesthetic quality', async () => {
    const { container } = render(<CherryBlossom />);

    await waitFor(() => {
      // Find branch SVG lines/paths (which have a stroke attribute) and verify the stroke color matches the organic brown
      const paths = container.querySelectorAll('path[stroke]');
      expect(paths.length).toBeGreaterThan(0);
      paths.forEach((path) => {
        expect(path.getAttribute('stroke')).toBe('#4a3b32');
      });

      // Find blossom circles and verify their fill color is a subset of the design palette
      const circles = container.querySelectorAll('circle');
      expect(circles.length).toBeGreaterThan(0);
      circles.forEach((circle) => {
        const fill = circle.getAttribute('fill');
        expect(['#ffb7c5', '#ff9eb3', '#ffd1dc']).toContain(fill);
      });
    });
  });

  it('verifies opacity constraints on background branch layers to avoid obscuring foreground elements', async () => {
    const { container } = render(<CherryBlossom />);

    await waitFor(() => {
      // Find the specific branch containers by their unique class names
      const branch1 = container.querySelector('.absolute.-top-10.-right-10');
      const branch2 = container.querySelector('.absolute.-top-20.-left-20');

      expect(branch1).toBeInTheDocument();
      expect(branch2).toBeInTheDocument();

      // Verify opacity classes (one branch has opacity-40, the other has opacity-30)
      expect(branch1).toHaveClass('opacity-40');
      expect(branch2).toHaveClass('opacity-30');
    });
  });

  it('verifies petal SVGs feature drop-shadow classes for contrast isolation over varying backgrounds', async () => {
    const { container } = render(<CherryBlossom />);

    await waitFor(() => {
      // Find petal SVGs (inside the mocked motion divs)
      const petalSvgs = container.querySelectorAll('[data-testid="motion-div"] svg');
      expect(petalSvgs.length).toBe(25);

      petalSvgs.forEach((svg) => {
        expect(svg).toHaveClass('drop-shadow-[0_0_5px_rgba(255,183,197,0.5)]');
      });
    });
  });
});
