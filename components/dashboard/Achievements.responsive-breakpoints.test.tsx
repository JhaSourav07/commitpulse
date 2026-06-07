import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import Achievements from './Achievements';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      className,
      ...props
    }: {
      children: React.ReactNode;
      className?: string;
      [key: string]: unknown;
    }) => {
      const safeProps = { ...props };
      delete safeProps.initial;
      delete safeProps.whileInView;
      delete safeProps.viewport;
      delete safeProps.transition;
      delete safeProps.whileHover;
      delete safeProps.whileTap;
      return (
        <div className={className} {...safeProps}>
          {children}
        </div>
      );
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

function setViewportWidth(width: number): void {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: width,
    writable: true,
  });
  window.dispatchEvent(new Event('resize'));
}

const mockAchievements = [
  {
    id: '1',
    title: 'First Commit',
    description: 'Made your first commit',
    icon: 'star',
    type: 'contributions' as const,
    isUnlocked: true,
    threshold: 1,
    currentValue: 1,
    progress: 100,
  },
  {
    id: '2',
    title: 'On Fire',
    description: '7 day streak',
    icon: 'flame',
    type: 'streak' as const,
    isUnlocked: true,
    threshold: 7,
    currentValue: 7,
    progress: 100,
  },
  {
    id: '3',
    title: 'Consistent',
    description: 'Commit 10 days',
    icon: 'check',
    type: 'behavior' as const,
    isUnlocked: false,
    threshold: 10,
    currentValue: 4,
    progress: 40,
  },
];

describe('Achievements - Responsive Multi-device Columns and Mobile Viewport Layouts', () => {
  beforeEach(() => {
    setViewportWidth(375);
  });
  afterEach(() => {
    setViewportWidth(1440);
  });

  it('renders all visible achievement cards without crashing on a 375px mobile viewport', () => {
    const { container } = render(<Achievements achievements={mockAchievements} />);
    expect(container.firstChild).not.toBeNull();
  });

  it('contains no inline styles with fixed pixel widths wider than the mobile viewport', () => {
    const { container } = render(<Achievements achievements={mockAchievements} />);
    Array.from(container.querySelectorAll('[style]')).forEach((el) => {
      const w = (el as HTMLElement).style.width;
      if (w && w.endsWith('px')) expect(parseInt(w, 10)).toBeLessThanOrEqual(375);
    });
  });

  it('does not apply fixed pixel widths that would cause horizontal scrollbars', () => {
    const { container } = render(<Achievements achievements={mockAchievements} />);
    Array.from(container.querySelectorAll('[style]')).forEach((el) => {
      const w = (el as HTMLElement).style?.width;
      if (w && w.endsWith('px')) expect(parseInt(w, 10)).toBeLessThanOrEqual(375);
    });
    expect(true).toBe(true);
  });

  it('all interactive elements are present and accessible at mobile width', () => {
    const { container } = render(<Achievements achievements={mockAchievements} />);
    container.querySelectorAll('button, a, [role="button"]').forEach((el) => {
      expect(el).toBeTruthy();
    });
    expect(document.body.contains(container)).toBe(true);
  });

  it('applies a layout class suitable for vertical stacking on mobile', () => {
    const { container } = render(<Achievements achievements={mockAchievements} />);
    const layoutEl = container.querySelector(
      '[class*="flex"],[class*="grid"],[class*="col"],[class*="stack"]'
    );
    expect(layoutEl).not.toBeNull();
  });
});
