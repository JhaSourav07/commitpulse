import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ThemeQuickPresets } from './ThemeQuickPresets';

describe('ThemeQuickPresets Massive Data Sets and Extreme High Bounds Scaling', () => {
  it('renders successfully through repeated large-scale mount cycles', () => {
    const onThemeChange = vi.fn();

    for (let i = 0; i < 100; i++) {
      const { unmount } = render(<ThemeQuickPresets theme="dark" onThemeChange={onThemeChange} />);

      expect(screen.getByLabelText('Apply dark theme')).toBeInTheDocument();

      unmount();
    }
  });

  it('renders all available theme preset buttons consistently across repeated instances', () => {
    const onThemeChange = vi.fn();

    render(
      <>
        {Array.from({ length: 50 }, (_, index) => (
          <ThemeQuickPresets key={index} theme="dark" onThemeChange={onThemeChange} />
        ))}
      </>
    );

    const darkButtons = screen.getAllByLabelText('Apply dark theme');

    expect(darkButtons.length).toBe(50);
  });

  it('handles large volumes of theme selection interactions without losing callback accuracy', () => {
    const onThemeChange = vi.fn();

    render(<ThemeQuickPresets theme="dark" onThemeChange={onThemeChange} />);

    const darkButton = screen.getByLabelText('Apply dark theme');
    const lightButton = screen.getByLabelText('Apply light theme');

    for (let i = 0; i < 500; i++) {
      fireEvent.click(darkButton);
      fireEvent.click(lightButton);
    }

    expect(onThemeChange).toHaveBeenCalledTimes(1000);
  });

  it('preserves active theme indicators during repeated rerenders', () => {
    const onThemeChange = vi.fn();

    const { rerender, container } = render(
      <ThemeQuickPresets theme="dark" onThemeChange={onThemeChange} />
    );

    for (let i = 0; i < 100; i++) {
      rerender(
        <ThemeQuickPresets theme={i % 2 === 0 ? 'dark' : 'light'} onThemeChange={onThemeChange} />
      );
    }

    expect(container.querySelector('.tqp-btn')).toBeInTheDocument();
  });

  it('renders SVG-based theme previews without DOM corruption under high instance counts', () => {
    const onThemeChange = vi.fn();

    render(
      <>
        {Array.from({ length: 25 }, (_, index) => (
          <ThemeQuickPresets key={index} theme="dark" onThemeChange={onThemeChange} />
        ))}
      </>
    );

    const svgElements = document.querySelectorAll('svg');

    expect(svgElements.length).toBeGreaterThan(100);
  });
});
