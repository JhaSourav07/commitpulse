import { describe, expect, it } from 'vitest';
import { buildQueryParams } from './utils';
import type { CustomizeOptions } from './types';

const setViewport = (width: number, height = 844) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });

  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });

  window.dispatchEvent(new Event('resize'));
};

const options: CustomizeOptions = {
  username: 'octocat',
  theme: 'dark',
  bgHex: 'ffffff',
  bgType: 'solid',
  bgStart: '',
  bgEnd: '',
  bgAngle: 90,
  accentHex: '000000',
  textHex: '111111',
  scale: 'linear',
  speed: '8s',
  font: 'Inter',
  year: '',
  radius: 8,
  size: 'medium',
  hideTitle: false,
  hideBackground: false,
  hideStats: false,
  viewMode: 'default',
  deltaFormat: 'percent',
  badgeWidth: '',
  badgeHeight: '',
  grace: 1,
  language: 'en',
  timezone: 'UTC',
};

describe('Utils Responsive Breakpoints', () => {
  it('preserves query generation on a standard mobile viewport (375px)', () => {
    setViewport(375);

    expect(window.innerWidth).toBe(375);

    const query = buildQueryParams(options);

    expect(query).toContain('user=octocat');
  });

  it('produces identical query parameters across viewport sizes', () => {
    setViewport(375);
    const mobile = buildQueryParams(options);

    setViewport(768);
    const tablet = buildQueryParams(options);

    setViewport(1440);
    const desktop = buildQueryParams(options);

    expect(mobile).toBe(tablet);
    expect(tablet).toBe(desktop);
  });

  it('does not introduce horizontal layout-specific parameters', () => {
    const query = buildQueryParams(options);

    expect(query).not.toContain('width=');
    expect(query).not.toContain('height=');
  });

  it('supports responsive viewport resizing without affecting output', () => {
    [320, 375, 414, 768, 1024, 1440].forEach((width) => {
      setViewport(width);

      expect(buildQueryParams(options)).toContain('user=octocat');
    });
  });

  it('keeps mobile customization options stable', () => {
    const mobileOptions = {
      ...options,
      hideStats: true,
      hideBackground: true,
    };

    const query = buildQueryParams(mobileOptions);

    expect(query).toContain('user=octocat');
    expect(query).toContain('hide_background=true');
    expect(query).toContain('hide_stats=true');
  });
});
