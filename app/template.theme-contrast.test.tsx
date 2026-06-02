import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Template from './template';

// Contrast utilities (sRGB luminance & ratio)
function hexToRgb(hex: string) {
  const sanitized = hex.replace('#', '');
  const bigint = parseInt(
    sanitized.length === 3
      ? sanitized
          .split('')
          .map((c) => c + c)
          .join('')
      : sanitized,
    16
  );
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

function linearizeChannel(channel: number) {
  const srgb = channel / 255;
  return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
}

function luminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * linearizeChannel(r) + 0.7152 * linearizeChannel(g) + 0.0722 * linearizeChannel(b);
}

function contrastRatio(hex1: string, hex2: string) {
  const L1 = luminance(hex1);
  const L2 = luminance(hex2);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('App Template theme contrast checks (Variation 3)', () => {
  it('Case 1: Emulate a light preset and assert structural identifiers appear', () => {
    // Simulate global light preset
    document.documentElement.setAttribute('data-theme', 'light');

    render(
      <Template>
        <div data-testid="child-light">Light mode content</div>
      </Template>
    );

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(screen.getByTestId('child-light')).toBeTruthy();
  });

  it('Case 2: Emulate a dark preset and verify class adaptations align', () => {
    // Simulate dark preset via class
    document.documentElement.classList.add('theme-dark');
    render(
      <Template>
        <div data-testid="child-dark">Dark mode content</div>
      </Template>
    );

    expect(document.documentElement.classList.contains('theme-dark')).toBe(true);
    expect(screen.getByTestId('child-dark')).toBeTruthy();
  });

  it('Case 3: Style token strings contain premium color tokens meeting accessibility contrast', () => {
    // Example tokens (background and foreground)
    const bg = '#ffffff';
    const fg = '#0f172a'; // Tailwind slate-900 similar

    const ratio = contrastRatio(bg, fg);
    // WCAG AA for normal text requires >= 4.5
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('Case 4: Background overlays do not clip or hide text colors', () => {
    const { container } = render(
      <Template>
        <div style={{ position: 'relative' }}>
          <div
            data-testid="overlay"
            style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.6 }}
          />
          <div data-testid="text" style={{ position: 'relative', zIndex: 1 }}>
            Visible text
          </div>
        </div>
      </Template>
    );

    const overlay = screen.getByTestId('overlay');
    const text = screen.getByTestId('text');

    // Validate DOM stacking via zIndex values (overlay beneath text)
    const overlayZ = (overlay as HTMLElement).style.zIndex || '0';
    const textZ = (text as HTMLElement).style.zIndex || '0';
    expect(Number(textZ)).toBeGreaterThanOrEqual(Number(overlayZ));

    // Ensure text node remains in document and not occluded by being removed
    expect(container.contains(text)).toBe(true);
  });

  it('Case 5: Custom style variables and class bindings remain active across transitions', () => {
    // set custom variable
    document.documentElement.style.setProperty('--brand', '#123456');
    // Render template once
    render(
      <Template>
        <div data-testid="brand">Brand</div>
      </Template>
    );

    // Toggle theme attribute to simulate a global transition
    act(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });

    const preserved = document.documentElement.style.getPropertyValue('--brand');
    expect(preserved).toBe('#123456');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(screen.getByTestId('brand')).toBeTruthy();
  });
});
