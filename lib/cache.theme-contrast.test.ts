import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { ThemeToggleButton } from '../app/components/theme-switch';

describe('Theme Contrast & Visual Cohesion', () => {
  it('ensures theme toggle button remains visible in light mode (contrast proxy check)', () => {
    document.documentElement.className = 'light';
    render(React.createElement(ThemeToggleButton, {}));

    // The component should remain structurally visible regardless of theme
    expect(screen.getByRole('button', { name: /toggle theme/i })).toBeVisible();
  });

  it('ensures theme toggle button remains visible in dark mode (contrast proxy check)', () => {
    document.documentElement.className = 'dark';
    render(React.createElement(ThemeToggleButton, {}));

    // The component should remain structurally visible regardless of theme
    expect(screen.getByRole('button', { name: /toggle theme/i })).toBeVisible();
  });
});
