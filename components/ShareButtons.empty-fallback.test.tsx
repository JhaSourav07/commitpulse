import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect } from 'vitest';
import ShareButtons from './ShareButtons';

describe('ShareButtons - Empty/Fallback Safety Tests', () => {
  // ---------------------------------------------------------------------------
  // 1.  Empty or missing primary data renders safely
  // ---------------------------------------------------------------------------
  it('renders without crashing when url is an empty string', () => {
    expect(() => render(<ShareButtons url="" />)).not.toThrow();

    // Both share links must still be present
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);

    // LinkedIn URL is still formed, just with an empty encoded value
    const linkedin = screen.getByRole('link', { name: /share on linkedin/i });
    expect(linkedin).toHaveAttribute(
      'href',
      'https://www.linkedin.com/sharing/share-offsite/?url='
    );
  });

  // ---------------------------------------------------------------------------
  // 2.  Null / undefined inputs trigger fallback behavior
  // ---------------------------------------------------------------------------
  it('handles omitted optional title via default parameter without errors', () => {
    // The component declares title? → title = '' at the destructuring level,
    // so omitting the prop or passing undefined is safe.
    const props: { url: string; title?: string } = {
      url: 'https://example.com',
    };

    expect(() => render(<ShareButtons url={props.url} />)).not.toThrow();

    // Twitter link must NOT contain a text parameter when title is not provided
    const twitter = screen.getByRole('link', { name: /share on x \/ twitter/i });
    expect(twitter.getAttribute('href')).not.toContain('&text=');
  });

  // ---------------------------------------------------------------------------
  // 3.  Empty state preserves expected wrapper structure
  // ---------------------------------------------------------------------------
  it('preserves expected DOM structure even with edge-case inputs', () => {
    const { container } = render(<ShareButtons url="" />);

    // Root container must exist
    const root = container.firstElementChild;
    expect(root).toBeInTheDocument();

    // Both links must have correct security attributes
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);
    links.forEach((link) => {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    // SVG icons must be present and marked as decorative
    const svgIcons = container.querySelectorAll('svg');
    expect(svgIcons).toHaveLength(2);
    svgIcons.forEach((icon) => {
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  // ---------------------------------------------------------------------------
  // 4.  Default styling / layout remains intact during empty rendering
  // ---------------------------------------------------------------------------
  it('retains standard layout classes when rendered with empty string url', () => {
    const { container } = render(<ShareButtons url="" />);

    // The wrapper div must keep its structural flex classes
    const rootDiv = container.firstElementChild;
    expect(rootDiv).toBeInTheDocument();
    expect(rootDiv?.className).toContain('flex');
    expect(rootDiv?.className).toContain('gap-3');

    // Both accessible labels must still be rendered
    expect(screen.getByRole('link', { name: /share on linkedin/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /share on x \/ twitter/i })).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // 5.  Rerendering between valid and empty states does not throw
  // ---------------------------------------------------------------------------
  it('survives rerender transitions between valid and empty url values', () => {
    const { rerender } = render(<ShareButtons url="https://example.com" />);

    // Initial render: both links present
    expect(screen.getAllByRole('link')).toHaveLength(2);

    // Transition to empty string
    expect(() => rerender(<ShareButtons url="" />)).not.toThrow();
    expect(screen.getAllByRole('link')).toHaveLength(2);

    // Transition back to a valid URL
    expect(() => rerender(<ShareButtons url="https://commitpulse.vercel.app" />)).not.toThrow();
    expect(screen.getAllByRole('link')).toHaveLength(2);

    // Final state must produce correct LinkedIn share URLs
    const linkedin = screen.getByRole('link', { name: /share on linkedin/i });
    expect(linkedin).toHaveAttribute(
      'href',
      'https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fcommitpulse.vercel.app'
    );
  });
});
