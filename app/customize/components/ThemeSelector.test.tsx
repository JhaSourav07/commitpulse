import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ThemeSelector } from './ThemeSelector';

describe('ThemeSelector', () => {
  it('renders theme selector', () => {
    render(<ThemeSelector theme="dracula" onThemeChange={vi.fn()} />);

    expect(screen.getByLabelText(/apply dracula theme/i)).toBeTruthy();
  });

  it('calls onThemeChange when neon preset is clicked', () => {
    const onThemeChange = vi.fn();

    render(<ThemeSelector theme="dracula" onThemeChange={onThemeChange} />);

    fireEvent.click(screen.getByLabelText(/apply neon theme/i));

    expect(onThemeChange).toHaveBeenCalledWith('neon');
  });
});
