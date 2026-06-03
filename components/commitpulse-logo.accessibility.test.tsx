import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CommitPulseLogo } from './commitpulse-logo';

describe('CommitPulseLogo accessibility', () => {
  it('renders the SVG logo correctly', () => {
    const { container } = render(<CommitPulseLogo />);

    const svg = container.querySelector('svg');

    expect(svg).toBeTruthy();
  });

  it('marks the SVG as aria-hidden for screen readers', () => {
    const { container } = render(<CommitPulseLogo />);

    const svg = container.querySelector('svg');

    expect(svg?.getAttribute('aria-hidden')).toBe('true');
  });

  it('applies custom class names correctly', () => {
    const { container } = render(<CommitPulseLogo className="h-10 w-10 text-cyan-400" />);

    const svg = container.querySelector('svg');

    expect(svg?.getAttribute('class')).toContain('h-10');
    expect(svg?.getAttribute('class')).toContain('w-10');
    expect(svg?.getAttribute('class')).toContain('text-cyan-400');
  });

  it('renders SVG paths for logo structure', () => {
    const { container } = render(<CommitPulseLogo />);

    const paths = container.querySelectorAll('path');

    expect(paths.length).toBe(4);
  });

  it('uses accessibility-safe SVG presentation attributes', () => {
    const { container } = render(<CommitPulseLogo />);

    const svg = container.querySelector('svg');

    expect(svg?.getAttribute('fill')).toBe('none');
    expect(svg?.getAttribute('stroke')).toBe('currentColor');
  });
});
