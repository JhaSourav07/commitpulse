import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render } from '@testing-library/react';
import { CommitPulseLogo } from './commitpulse-logo';

describe('CommitPulseLogo - Edge Cases & Empty/Missing Inputs', () => {
  it('renders successfully without any props (undefined parameters)', () => {
    expect(() => render(<CommitPulseLogo />)).not.toThrow();
  });

  it('renders a fallback default className when no props are provided', () => {
    const { container } = render(<CommitPulseLogo />);
    const svgElement = container.querySelector('svg');

    expect(svgElement).toBeInTheDocument();
    expect(svgElement).toHaveClass('h-5', 'w-5');
  });

  it('renders successfully with an empty string as className', () => {
    const { container } = render(<CommitPulseLogo className="" />);
    const svgElement = container.querySelector('svg');

    expect(svgElement).toBeInTheDocument();
    // It should have an empty class or no class attributes breaking the layout
    expect(svgElement?.getAttribute('class')).toBe('');
  });

  it('maintains standard DOM structure (SVG paths) without props', () => {
    const { container } = render(<CommitPulseLogo />);
    const paths = container.querySelectorAll('path');

    // The logo should contain 4 paths even in empty/default state
    expect(paths.length).toBe(4);
  });

  it('maintains expected aria-hidden state without crashing', () => {
    const { container } = render(<CommitPulseLogo />);
    const svgElement = container.querySelector('svg');

    expect(svgElement).toHaveAttribute('aria-hidden', 'true');
  });
});
