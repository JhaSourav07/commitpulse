import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect } from 'vitest';
import ShareButtons from './ShareButtons';

describe('ShareButtons - Empty/Fallback Safety Tests', () => {
  // Test 1: Minimal Valid Render
  it('renders successfully with only the required url prop', () => {
    const { container } = render(<ShareButtons url="https://example.com" />);

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);
    expect(screen.getByRole('link', { name: /share on linkedin/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /share on x \/ twitter/i })).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  // Test 2: Missing Optional Inputs
  it('handles omitted optional title prop gracefully', () => {
    render(<ShareButtons url="https://example.com" />);

    const twitter = screen.getByRole('link', { name: /share on x \/ twitter/i });
    expect(twitter).toHaveAttribute(
      'href',
      'https://x.com/intent/tweet?url=https%3A%2F%2Fexample.com'
    );
    expect(twitter.getAttribute('href')).not.toContain('&text=');

    // All links still render
    expect(screen.getByRole('link', { name: /share on linkedin/i })).toBeInTheDocument();
  });

  // Test 3: Empty Values Handling
  it('renders without crashing when url is an empty string', () => {
    expect(() => render(<ShareButtons url="" />)).not.toThrow();

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);

    // LinkedIn URL with empty encoded string
    const linkedin = screen.getByRole('link', { name: /share on linkedin/i });
    expect(linkedin).toHaveAttribute(
      'href',
      'https://www.linkedin.com/sharing/share-offsite/?url='
    );
  });

  // Test 4: Null and Undefined Inputs
  it('handles undefined title via default parameter without errors', () => {
    const props: { url: string; title?: string } = {
      url: 'https://example.com',
    };

    expect(() => render(<ShareButtons url={props.url} />)).not.toThrow();

    const twitter = screen.getByRole('link', { name: /share on x \/ twitter/i });
    expect(twitter).toHaveAttribute(
      'href',
      'https://x.com/intent/tweet?url=https%3A%2F%2Fexample.com'
    );
    expect(twitter.getAttribute('href')).not.toContain('&text=');
  });

  // Test 5: Structural Integrity Verification
  it('maintains expected DOM structure in empty-edge state', () => {
    const { container } = render(<ShareButtons url="https://example.com" />);

    // Root div with flex classes
    const rootDiv = container.firstElementChild;
    expect(rootDiv).toBeInTheDocument();
    expect(rootDiv?.className).toContain('flex');
    expect(rootDiv?.className).toContain('gap-3');

    // Both links have correct security attributes
    const links = screen.getAllByRole('link');
    links.forEach((link) => {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    // SVG icons are rendered within each link
    const svgIcons = container.querySelectorAll('svg');
    expect(svgIcons).toHaveLength(2);
    svgIcons.forEach((icon) => {
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });
});
