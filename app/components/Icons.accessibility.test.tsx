import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { BoxIcon, CheckIcon, CloseIcon, CopyIcon, ZapIcon } from './Icons';

describe('Icons accessibility behavior', () => {
  it('renders CopyIcon as decorative with aria-hidden="true"', () => {
    const { container } = render(<CopyIcon />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders ZapIcon as decorative with aria-hidden="true"', () => {
    const { container } = render(<ZapIcon />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders BoxIcon as decorative with aria-hidden="true"', () => {
    const { container } = render(<BoxIcon />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders CheckIcon as decorative with aria-hidden="true"', () => {
    const { container } = render(<CheckIcon />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders CloseIcon as decorative with aria-hidden="true"', () => {
    const { container } = render(<CloseIcon />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
  });

  it('includes basic structural roles on SVG elements', () => {
    const { container } = render(<CopyIcon />);
    const svg = container.querySelector('svg');
    // Lucide components use standard svg elements which imply a graphics role,
    // and setting aria-hidden="true" makes it decorative.
    expect(svg?.tagName.toLowerCase()).toBe('svg');
  });
});
