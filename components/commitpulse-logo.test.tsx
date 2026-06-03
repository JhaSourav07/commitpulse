import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { CommitPulseLogo } from './commitpulse-logo';

describe('CommitPulseLogo Component', () => {
  it('renders an <svg> element with proper viewport dimensions', () => {
    const { container } = render(<CommitPulseLogo />);
    const svg = container.querySelector('svg');

    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');
  });

  it('asserts that path elements are drawn representing the pulse shape', () => {
    const { container } = render(<CommitPulseLogo />);
    const paths = container.querySelectorAll('path');

    // The component specifically draws 4 geometric paths
    expect(paths.length).toBe(4);
  });

  it('verifies support for custom className properties', () => {
    const testClass = 'custom-pulse-class';
    const { container } = render(<CommitPulseLogo className={testClass} />);
    const svg = container.querySelector('svg');

    expect(svg?.classList.contains(testClass)).toBe(true);
  });

  it('verifies support for custom width and height properties via Tailwind classes', () => {
    const { container } = render(<CommitPulseLogo className="w-12 h-12" />);
    const svg = container.querySelector('svg');

    // The default h-5 w-5 should be replaced or overridden by the provided class
    expect(svg?.classList.contains('w-12')).toBe(true);
    expect(svg?.classList.contains('h-12')).toBe(true);
  });

  it('verifies theme colors map correctly to the SVG via currentColor', () => {
    const { container } = render(<CommitPulseLogo />);
    const svg = container.querySelector('svg');

    // For Tailwind text-* classes to color the SVG, stroke must be currentColor and fill must be none
    expect(svg?.getAttribute('stroke')).toBe('currentColor');
    expect(svg?.getAttribute('fill')).toBe('none');
  });
});
