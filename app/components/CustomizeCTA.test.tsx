import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CustomizeCTA } from './CustomizeCTA';

// framer-motion relies on browser animation APIs that jsdom doesn't implement.
// Swapping motion.div for a plain div lets us test content without fighting the animation layer.
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

// next/link needs a real Next.js router to work. A plain <a> is a faithful enough
// stand-in for everything these tests care about.
vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('CustomizeCTA', () => {
  describe('text content', () => {
    it('renders the CTA button label', () => {
      render(<CustomizeCTA />);

      expect(screen.getByText('Open Customization Studio')).toBeTruthy();
    });

    it('renders the section heading', () => {
      render(<CustomizeCTA />);

      expect(screen.getByText('Want to fine-tune your monolith?')).toBeTruthy();
    });

    it('renders the eyebrow label above the heading', () => {
      render(<CustomizeCTA />);

      expect(screen.getByText('Customization Studio')).toBeTruthy();
    });

    it('renders the descriptive body copy', () => {
      render(<CustomizeCTA />);

      // Partial match because the text is long and may contain internal whitespace in the DOM.
      expect(screen.getByText(/Dial in every pixel/i)).toBeTruthy();
    });
  });

  describe('document structure', () => {
    it('renders the section heading as an <h2>', () => {
      render(<CustomizeCTA />);

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeTruthy();
      expect(heading.textContent).toContain('Want to fine-tune your monolith?');
    });

    it('renders exactly one link', () => {
      render(<CustomizeCTA />);

      expect(screen.getAllByRole('link')).toHaveLength(1);
    });

    it('the CTA link has visible text so screen readers can describe it', () => {
      render(<CustomizeCTA />);

      const link = screen.getByRole('link');
      expect(link.textContent?.trim()).toBeTruthy();
    });
  });

  describe('navigation', () => {
    it('points to the /customize page', () => {
      render(<CustomizeCTA />);

      const link = screen.getByRole('link');
      expect(link.getAttribute('href')).toBe('/customize');
    });

    it('fires a click event when the link is activated', () => {
      const handleClick = vi.fn();
      render(<CustomizeCTA />);

      const link = screen.getByRole('link');
      link.addEventListener('click', handleClick);
      fireEvent.click(link);

      expect(handleClick).toHaveBeenCalledOnce();
    });
  });

  describe('accessibility', () => {
    it('gives the CTA link a stable id for analytics and E2E selectors', () => {
      render(<CustomizeCTA />);

      const link = screen.getByRole('link');
      expect(link.getAttribute('id')).toBe('open-customization-studio-cta');
    });

    it('marks the decorative shimmer overlay as aria-hidden', () => {
      const { container } = render(<CustomizeCTA />);

      // The shimmer span is purely visual — hiding it prevents screen readers
      // from announcing it as a mysterious empty element.
      const hiddenSpans = container.querySelectorAll('span[aria-hidden="true"]');
      expect(hiddenSpans.length).toBeGreaterThan(0);
    });

    it('marks the decorative SVG icon inside the button as aria-hidden', () => {
      const { container } = render(<CustomizeCTA />);

      const decorativeIcon = container.querySelector('svg[aria-hidden="true"]');
      expect(decorativeIcon).toBeTruthy();
    });
  });
});
