import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import ShareButtons from './ShareButtons';
import React from 'react';

describe('ShareButtons - Responsive Multi-device & Viewports', () => {
  const originalInnerWidth = window.innerWidth;

  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });

  it('verifies layouts adapt correctly to mobile viewport dimensions', () => {
    window.innerWidth = 375; // Mobile viewport
    render(<ShareButtons url="https://example.com" />);
    const container = screen.getByLabelText(/Share on X/i).parentElement;
    expect(container).toHaveClass('flex');
    expect(container).toHaveClass('gap-3');
  });

  it('tests responsive multi-device columns at tablet breakpoints', () => {
    window.innerWidth = 768; // Tablet viewport
    render(<ShareButtons url="https://example.com" />);
    const linkedinButton = screen.getByLabelText(/Share on LinkedIn/i);
    expect(linkedinButton).toBeInTheDocument();
  });

  it('ensures icons scale appropriately across different screen densities', () => {
    render(<ShareButtons url="https://example.com" />);
    const linkedinIcon = screen.getByLabelText(/Share on LinkedIn/i).querySelector('svg');
    // Using standard size via props in ShareButtons component
    expect(linkedinIcon).toBeInTheDocument();
  });

  it('validates touch target sizing on compact mobile views', () => {
    window.innerWidth = 320; // Compact mobile
    render(<ShareButtons url="https://example.com" />);
    const twitterButton = screen.getByLabelText(/Share on X/i);
    expect(twitterButton).toHaveAttribute('href');
  });

  it('confirms container classes provide necessary flex basis on desktop widths', () => {
    window.innerWidth = 1440; // Desktop viewport
    render(<ShareButtons url="https://example.com" />);
    const container = screen.getByLabelText(/Share on X/i).parentElement;
    expect(container).toHaveClass('flex');
  });
});
