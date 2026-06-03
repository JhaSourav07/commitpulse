import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ThemeToggleButton, createAnimation } from './theme-switch';

describe('theme-switch empty fallback behavior', () => {
  it('renders ThemeToggleButton without props', () => {
    render(<ThemeToggleButton />);

    expect(screen.getByRole('button', { name: /toggle theme/i })).toBeTruthy();
  });

  it('creates animation with required arguments only', () => {
    const animation = createAnimation('circle');

    expect(animation).toBeDefined();
    expect(animation.name).toContain('circle');
  });

  it('creates rectangle animation without throwing', () => {
    expect(() => {
      createAnimation('rectangle');
    }).not.toThrow();
  });

  it('creates animation with default start position', () => {
    const animation = createAnimation('circle');

    expect(animation.css).toBeTruthy();
  });

  it('renders button safely with empty className', () => {
    render(<ThemeToggleButton className="" />);

    expect(screen.getByRole('button', { name: /toggle theme/i })).toBeTruthy();
  });
});
