import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BoxIcon, CheckIcon, CloseIcon, CopyIcon, ZapIcon } from './Icons';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Icons — responsive breakpoints', () => {
  it('icon dimensions are bounded values that will not cause horizontal overflow on a 375 px mobile viewport', () => {
    const { container: c1 } = render(<CopyIcon />);
    const { container: c2 } = render(<ZapIcon />);
    const { container: c3 } = render(<BoxIcon />);
    const { container: c4 } = render(<CheckIcon />);
    const { container: c5 } = render(<CloseIcon />);

    const MOBILE_WIDTH = 375;
    for (const container of [c1, c2, c3, c4, c5]) {
      const svg = container.querySelector('svg');
      expect(svg).not.toBeNull();
      const widthAttr = svg!.getAttribute('width');
      expect(widthAttr).not.toBeNull();
      const width = Number(widthAttr);
      expect(Number.isFinite(width)).toBe(true);
      expect(width).toBeGreaterThan(0);
      expect(width).toBeLessThanOrEqual(MOBILE_WIDTH);
    }
  });

  it('all icons use explicit numeric width and height attributes — no percentage or auto values that could cause layout instability', () => {
    const icons = [
      render(<CopyIcon />),
      render(<ZapIcon />),
      render(<BoxIcon />),
      render(<CheckIcon />),
      render(<CloseIcon />),
    ];

    for (const { container } of icons) {
      const svg = container.querySelector('svg');
      const width = svg?.getAttribute('width');
      const height = svg?.getAttribute('height');
      expect(Number(width)).toBeGreaterThan(0);
      expect(Number(height)).toBeGreaterThan(0);
    }
  });

  it('CopyIcon and CheckIcon use compact 20 px sizing appropriate for inline/mobile use', () => {
    const { container: copyContainer } = render(<CopyIcon />);
    const { container: checkContainer } = render(<CheckIcon />);

    expect(Number(copyContainer.querySelector('svg')?.getAttribute('width'))).toBe(20);
    expect(Number(copyContainer.querySelector('svg')?.getAttribute('height'))).toBe(20);
    expect(Number(checkContainer.querySelector('svg')?.getAttribute('width'))).toBe(20);
    expect(Number(checkContainer.querySelector('svg')?.getAttribute('height'))).toBe(20);
  });

  it('CloseIcon uses a smaller 18 px footprint suitable for dismissal controls on narrow viewports', () => {
    const { container } = render(<CloseIcon />);
    const svg = container.querySelector('svg');

    expect(Number(svg?.getAttribute('width'))).toBe(18);
    expect(Number(svg?.getAttribute('height'))).toBe(18);
  });

  it('ZapIcon and BoxIcon use 24 px sizing that stays within standard mobile touch-target bounds', () => {
    const { container: zapContainer } = render(<ZapIcon />);
    const { container: boxContainer } = render(<BoxIcon />);

    const TOUCH_TARGET = 48;
    for (const container of [zapContainer, boxContainer]) {
      const width = Number(container.querySelector('svg')?.getAttribute('width'));
      const height = Number(container.querySelector('svg')?.getAttribute('height'));
      expect(width).toBe(24);
      expect(height).toBe(24);
      expect(width).toBeLessThanOrEqual(TOUCH_TARGET);
      expect(height).toBeLessThanOrEqual(TOUCH_TARGET);
    }
  });
});
