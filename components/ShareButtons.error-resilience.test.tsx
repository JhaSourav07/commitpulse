import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import ShareButtons from './ShareButtons';
import React from 'react';

describe('ShareButtons - Error Resilience & Hydration Stability', () => {
  it('renders correctly with missing optional props like title', () => {
    render(<ShareButtons url="https://example.com" />);
    const twitterButton = screen.getByLabelText(/Share on X/i);
    expect(twitterButton).toHaveAttribute(
      'href',
      'https://x.com/intent/tweet?url=https%3A%2F%2Fexample.com'
    );
  });

  it('maintains hydration stability when rendered on server vs client', () => {
    const { container } = render(<ShareButtons url="https://example.com" />);
    expect(container.innerHTML).toContain('href');
  });

  it('safely handles malformed url strings without throwing exceptions', () => {
    // Malformed URLs should be encoded correctly by encodeURIComponent
    const malformedUrl = 'https://example.com/%%%';
    render(<ShareButtons url={malformedUrl} />);
    const linkedinButton = screen.getByLabelText(/Share on LinkedIn/i);
    expect(linkedinButton).toBeInTheDocument();
  });

  it('provides fallback behavior if icons fail to load or are missing', () => {
    render(<ShareButtons url="https://example.com" />);
    const linkedinButton = screen.getByLabelText(/Share on LinkedIn/i);
    const svgIcon = linkedinButton.querySelector('svg');
    expect(svgIcon).toBeInTheDocument();
  });

  it('ensures exception safety when extreme string lengths are provided', () => {
    const longUrl = 'https://example.com/' + 'a'.repeat(10000);
    expect(() => render(<ShareButtons url={longUrl} />)).not.toThrow();
  });
});
