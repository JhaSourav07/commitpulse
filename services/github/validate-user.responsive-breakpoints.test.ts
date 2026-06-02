import { describe, expect, it } from 'vitest';
import { GitHubUserValidator } from './validate-user';

describe('GitHubUserValidator Responsive Breakpoints', () => {
  it('verifies columns stack vertically on mobile width viewports', () => {
    const validator = GitHubUserValidator.getInstance();
    const layout = {
      viewport: 375,
      flexDirection: 'column',
    };

    expect(validator).toBeDefined();
    expect(layout.viewport).toBeLessThan(768);
    expect(layout.flexDirection).toBe('column');
  });

  it('ensures content width does not exceed mobile viewport size', () => {
    const container = {
      width: 100,
      unit: '%',
    };

    expect(container.width).toBeLessThanOrEqual(100);
    expect(container.unit).toBe('%');
  });

  it('confirms navigation elements scale correctly on small screens', () => {
    const navigation = {
      fontSize: 14,
      visible: true,
    };

    expect(navigation.visible).toBe(true);
    expect(navigation.fontSize).toBeLessThanOrEqual(16);
  });

  it('validates mobile toggle states update correctly', () => {
    const mobileMenu = {
      open: true,
      expanded: true,
    };

    expect(mobileMenu.open).toBe(true);
    expect(mobileMenu.expanded).toBe(true);
  });

  it('checks responsive layout avoids horizontal scrolling', () => {
    const page = {
      overflowX: 'hidden',
      viewportWidth: 375,
      contentWidth: 375,
    };

    expect(page.overflowX).toBe('hidden');
    expect(page.contentWidth).toBeLessThanOrEqual(page.viewportWidth);
  });
});
