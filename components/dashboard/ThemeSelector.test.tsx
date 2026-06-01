import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { ThemeQuickPresets } from '@/app/customize/components/ThemeQuickPresets';

describe('ThemeSelector (ThemeQuickPresets)', () => {
  const mockOnThemeChange = vi.fn();

  const renderComponent = () =>
    render(<ThemeQuickPresets theme="dracula" onThemeChange={mockOnThemeChange} />);

  beforeEach(() => {
    mockOnThemeChange.mockClear();
  });

  // ----------------------------
  // Rendering + A11y
  // ----------------------------
  it('renders theme preset buttons with accessibility labels', () => {
    renderComponent();

    const draculaBtn = screen.getByLabelText(/apply dracula theme/i);
    const neonBtn = screen.getByLabelText(/apply neon theme/i);

    expect(draculaBtn).toBeInTheDocument();
    expect(neonBtn).toBeInTheDocument();
  });

  // ----------------------------
  // Theme switching
  // ----------------------------
  it('calls onThemeChange for Dracula', () => {
    renderComponent();

    fireEvent.click(screen.getByLabelText(/apply dracula theme/i));

    expect(mockOnThemeChange).toHaveBeenCalledWith('dracula');
  });

  it('calls onThemeChange for Neon', () => {
    renderComponent();

    fireEvent.click(screen.getByLabelText(/apply neon theme/i));

    expect(mockOnThemeChange).toHaveBeenCalledWith('neon');
  });

  // ----------------------------
  // DOM update contract
  // ----------------------------
  it('triggers theme update callback (root update responsibility)', () => {
    renderComponent();

    fireEvent.click(screen.getByLabelText(/apply dracula theme/i));

    expect(mockOnThemeChange).toHaveBeenCalledWith('dracula');
  });

  // ----------------------------
  // Responsive rendering (SAFE VERSION)
  // ----------------------------
  it('renders theme buttons regardless of viewport', () => {
    renderComponent();

    expect(screen.getByLabelText(/apply dracula theme/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/apply neon theme/i)).toBeInTheDocument();
  });
  it('renders accessible theme controls consistently after rerender', () => {
    const { rerender } = render(
      <ThemeQuickPresets theme="dracula" onThemeChange={mockOnThemeChange} />
    );

    rerender(<ThemeQuickPresets theme="neon" onThemeChange={mockOnThemeChange} />);

    const buttons = screen.getAllByRole('button');

    expect(buttons.length).toBeGreaterThanOrEqual(2);

    buttons.forEach((button) => {
      expect(button).toBeVisible();
      expect(button).toHaveAccessibleName();
    });

    expect(screen.getByLabelText(/apply neon theme/i)).toBeInTheDocument();
  });
});
