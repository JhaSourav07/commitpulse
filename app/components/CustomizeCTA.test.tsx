/* eslint-disable @typescript-eslint/no-unused-vars */
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
      const { container } = render(<CustomizeCTA />);

      expect(screen.getByText('Open Customization Studio')).toBeTruthy();
    });

    it('renders the section heading', () => {
      const { container } = render(<CustomizeCTA />);

      expect(screen.getByText('Want to fine-tune your monolith?')).toBeTruthy();
    });

    it('renders the eyebrow label above the heading', () => {
      const { container } = render(<CustomizeCTA />);

      expect(screen.getByText('Customization Studio')).toBeTruthy();
    });

    it('renders the descriptive body copy', () => {
      const { container } = render(<CustomizeCTA />);

      expect(screen.getByText(/Dial in every pixel/i)).toBeTruthy();
    });
  });

  describe('document structure', () => {
    it('renders the section heading as exactly one <h2>', () => {
      const { container } = render(<CustomizeCTA />);

      const heading = screen.getByRole('heading', {
        level: 2,
        name: 'Want to fine-tune your monolith?',
      });

      expect(heading).toBeTruthy();
      expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(1);
      expect(heading.textContent).toBe('Want to fine-tune your monolith?');
    });

    it('renders exactly one link', () => {
      const { container } = render(<CustomizeCTA />);

      expect(screen.getAllByRole('link')).toHaveLength(1);
    });

    it('the CTA link has visible text so screen readers can describe it', () => {
      const { container } = render(<CustomizeCTA />);

      const link = screen.getByRole('link');
      expect(link.textContent?.trim()).toBeTruthy();
    });
  });

  describe('navigation', () => {
    it('points to the /customize page', () => {
      const { container } = render(<CustomizeCTA />);

      const link = screen.getByRole('link');
      expect(link.getAttribute('href')).toBe('/customize');
    });

    it('fires a click event when the link is activated', () => {
      const handleClick = vi.fn();
      const { container } = render(<CustomizeCTA />);

      const link = screen.getByRole('link');
      link.addEventListener('click', handleClick);
      fireEvent.click(link);

      expect(handleClick).toHaveBeenCalledOnce();
    });
  });

  describe('responsive navigation', () => {
    it.each([
      ['mobile', 375],
      ['desktop', 1280],
    ])('keeps the customization link visible at the %s breakpoint', (_breakpoint, width) => {
      window.innerWidth = width;

      const { container } = render(<CustomizeCTA />);

      const layout = container.querySelector('.flex.flex-col.md\\:flex-row');
      const link = screen.getByRole('link', { name: /open customization studio/i });

      expect(layout).toBeTruthy();
      expect(link).toBeTruthy();
      expect(link.getAttribute('href')).toBe('/customize');
    });
  });

  describe('accessibility', () => {
    it('gives the CTA link a stable id for analytics and E2E selectors', () => {
      const { container } = render(<CustomizeCTA />);

      const link = screen.getByRole('link');
      expect(link.getAttribute('id')).toBe('open-customization-studio-cta');
    });

    it('marks the decorative shimmer overlay as aria-hidden', () => {
      const { container } = render(<CustomizeCTA />);

      const hiddenSpans = container.querySelectorAll('span[aria-hidden="true"]');
      expect(hiddenSpans.length).toBeGreaterThan(0);
    });

    it('marks the decorative SVG icon inside the button as aria-hidden', () => {
      const { container } = render(<CustomizeCTA />);

      const decorativeIcon = container.querySelector('svg[aria-hidden="true"]');
      expect(decorativeIcon).toBeTruthy();
    });
  });
  describe('responsive rendering', () => {
    it('uses responsive flex layout classes', () => {
      const { container } = render(<CustomizeCTA />);

      const layoutContainer = container.querySelector('.flex.flex-col.md\\:flex-row');

      expect(layoutContainer).toBeTruthy();
    });

    it('uses responsive text alignment classes', () => {
      const { container } = render(<CustomizeCTA />);

      const contentContainer = container.querySelector('.text-center.md\\:text-left');

      expect(contentContainer).toBeTruthy();
    });

    it('uses responsive heading sizing classes', () => {
      render(<CustomizeCTA />);

      const heading = screen.getByRole('heading', {
        level: 2,
        name: 'Want to fine-tune your monolith?',
      });

      expect(heading.className).toContain('text-2xl');
      expect(heading.className).toContain('md:text-3xl');
    });

    it('uses responsive button padding classes', () => {
      render(<CustomizeCTA />);

      const link = screen.getByRole('link');

      const button = link.querySelector('span');

      expect(button?.className).toContain('px-4');
      expect(button?.className).toContain('md:px-7');
    });
  });

  describe('responsive breakpoints', () => {
    it('renders all layout structure elements across viewports', () => {
      const { container } = render(<CustomizeCTA />);

      // Container with customization-studio id
      const ctaSection = container.querySelector('#customization-studio');
      expect(ctaSection).toBeTruthy();

      // Outer rounded card container
      const cardContainer = container.querySelector('[class*="rounded-[2rem]"]');
      expect(cardContainer).toBeTruthy();

      // Inner flex container that applies responsive layout
      const flexContainer = container.querySelector('[class*="flex"]');
      expect(flexContainer).toBeTruthy();

      // Text content area
      const textArea = container.querySelector('[class*="flex-1"]');
      expect(textArea).toBeTruthy();

      // CTA button shrink wrapper
      const buttonWrapper = container.querySelector('[class*="shrink-0"]');
      expect(buttonWrapper).toBeTruthy();
    });

    it('renders responsive text sizing from mobile to desktop', () => {
      const { container } = render(<CustomizeCTA />);

      const heading = screen.getByRole('heading', { level: 2 });

      // Check that heading has responsive classes (text-2xl for mobile, md:text-3xl for desktop)
      const headingClass = heading.getAttribute('class');
      expect(headingClass).toMatch(/text-2xl/);
      expect(headingClass).toMatch(/md:text-3xl/);
    });

    it('applies responsive gap and flex direction across breakpoints', () => {
      const { container } = render(<CustomizeCTA />);

      // Find the flex container with responsive gap and flex direction
      // gap-8 for consistent spacing, md:flex-row for desktop layout
      const flexContent = container.querySelector('[class*="flex"][class*="gap-8"]');
      expect(flexContent).toBeTruthy();

      const flexClass = flexContent?.getAttribute('class') || '';
      expect(flexClass).toMatch(/gap-8/);
      expect(flexClass).toMatch(/md:flex-row/);
      expect(flexClass).toMatch(/flex-col/);
    });

    it('ensures button styling is responsive across viewports', () => {
      const { container } = render(<CustomizeCTA />);

      const button = container.querySelector('[class*="px-4"][class*="md:px-"]');
      expect(button).toBeTruthy();

      const buttonClass = button?.getAttribute('class') || '';
      expect(buttonClass).toMatch(/px-4/);
      expect(buttonClass).toMatch(/md:px-7/);
    });

    it('renders decorative background blobs that are hidden from interaction', () => {
      const { container } = render(<CustomizeCTA />);

      const blobs = container.querySelectorAll('[class*="blur-"]');
      expect(blobs.length).toBeGreaterThanOrEqual(2);

      blobs.forEach((blob) => {
        const blobClass = blob.getAttribute('class') || '';
        expect(blobClass).toMatch(/pointer-events-none/);
      });
    });

    it('verifies navigation path is correct across all viewport sizes', () => {
      const { container } = render(<CustomizeCTA />);

      const link = screen.getByRole('link');
      expect(link.getAttribute('href')).toBe('/customize');

      // Link should be visible and accessible regardless of viewport
      expect(link).toHaveProperty('textContent');
      expect(link.textContent).toContain('Open Customization Studio');
    });

    it('renders heading text layout appropriate for mobile and desktop', () => {
      const { container } = render(<CustomizeCTA />);

      const eyebrowLabel = screen.getByText('Customization Studio');
      const eyebrowClass = eyebrowLabel.getAttribute('class') || '';

      // Verify eyebrow styling is consistent
      expect(eyebrowClass).toMatch(/uppercase/);
      expect(eyebrowClass).toMatch(/text-xs/);

      const heading = screen.getByRole('heading', { level: 2 });
      const headingClass = heading.getAttribute('class') || '';

      // Heading has responsive text sizing
      expect(headingClass).toMatch(/text-2xl/);
      expect(headingClass).toMatch(/md:text-3xl/);

      // Heading's parent container has responsive text alignment
      const parentContainer = heading.closest('[class*="flex-1"]');
      expect(parentContainer).toBeTruthy();

      const parentClass = parentContainer?.getAttribute('class') || '';
      expect(parentClass).toMatch(/text-center/);
      expect(parentClass).toMatch(/md:text-left/);
    });

    it('renders content sections with responsive text alignment', () => {
      const { container } = render(<CustomizeCTA />);

      const contentArea = container.querySelector('[class*="text-center"][class*="md:text-left"]');
      expect(contentArea).toBeTruthy();

      const contentClass = contentArea?.getAttribute('class') || '';
      expect(contentClass).toMatch(/text-center/);
      expect(contentClass).toMatch(/md:text-left/);
    });
  });
});
