import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { BoxIcon, CheckIcon, CloseIcon, CopyIcon, ZapIcon } from './Icons';

describe('Icons theme contrast behavior', () => {
  it('renders CheckIcon with fixed semantic color for success state', () => {
    const { container } = render(<CheckIcon />);
    const svg = container.querySelector('svg');
    // Verifies the icon maintains visual cohesion by using a fixed color
    // that works well in both light and dark modes
    expect(svg?.getAttribute('stroke')).toBe('#10b981');
  });

  it('renders CopyIcon with inherited color for theme adaptability', () => {
    const { container } = render(<CopyIcon />);
    const svg = container.querySelector('svg');
    // Verifies the icon uses currentColor to adapt to parent theme context
    expect(svg?.getAttribute('stroke')).toBe('currentColor');
  });

  it('renders ZapIcon with inherited color for theme adaptability', () => {
    const { container } = render(<ZapIcon />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('stroke')).toBe('currentColor');
  });

  it('renders BoxIcon with inherited color for theme adaptability', () => {
    const { container } = render(<BoxIcon />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('stroke')).toBe('currentColor');
  });

  it('renders CloseIcon with inherited color for theme adaptability', () => {
    const { container } = render(<CloseIcon />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('stroke')).toBe('currentColor');
  });
});
