import '@testing-library/jest-dom/vitest';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { CommitPulseLogo } from './commitpulse-logo';

describe('CommitPulseLogo Component', () => {
  it('renders SVG element correctly', () => {
    const { container } = render(<CommitPulseLogo />);
    const svgElement = container.querySelector('svg');

    expect(svgElement).toBeInTheDocument();
    expect(svgElement).toHaveAttribute('viewBox', '0 0 24 24');
    expect(svgElement).toHaveAttribute('fill', 'none');
    expect(svgElement).toHaveAttribute('stroke', 'currentColor');
  });

  it('applies default className if none is provided', () => {
    const { container } = render(<CommitPulseLogo />);
    const svgElement = container.querySelector('svg');
    expect(svgElement).toHaveClass('h-5', 'w-5');
  });

  it('applies custom className passed via props', () => {
    const { container } = render(<CommitPulseLogo className="h-10 w-10 text-red-500" />);
    const svgElement = container.querySelector('svg');
    expect(svgElement).toHaveClass('h-10', 'w-10', 'text-red-500');
    expect(svgElement).not.toHaveClass('h-5', 'w-5');
  });

  it('sets aria-hidden to true for accessibility', () => {
    const { container } = render(<CommitPulseLogo />);
    const svgElement = container.querySelector('svg');
    expect(svgElement).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders required path elements for the logo geometry', () => {
    const { container } = render(<CommitPulseLogo />);
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBe(4);

    // Check that one of the path d-attributes matches the 3D box frame
    const pathDAttributes = Array.from(paths).map((p) => p.getAttribute('d'));
    expect(pathDAttributes).toContain(
      'M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z'
    );
  });
});
