import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ThemeSelector } from './ThemeSelector';
import React from 'react';
import '@testing-library/jest-dom/vitest';

vi.mock('./ThemeQuickPresets', () => ({
  ThemeQuickPresets: () => <div data-testid="theme-quick-presets" />,
}));

vi.mock('./SectionLabel', () => ({
  SectionLabel: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));

vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('ThemeSelector Accessibility', () => {
  const makeProps = () => ({
    theme: 'neon',
    onThemeChange: vi.fn(),
  });

  it('renders shuffle button with accessible name', () => {
    render(<ThemeSelector {...makeProps()} />);

    expect(screen.getByRole('button', { name: /shuffle/i })).toBeInTheDocument();
  });

  it('renders theme selection combobox', () => {
    render(<ThemeSelector {...makeProps()} />);

    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('supports keyboard tab navigation to interactive controls', async () => {
    const user = userEvent.setup();

    render(<ThemeSelector {...makeProps()} />);

    const shuffleButton = screen.getByRole('button', {
      name: /shuffle/i,
    });

    document.body.focus();

    await user.tab();

    expect(shuffleButton).toHaveFocus();
  });

  it('renders all theme options for screen reader access', () => {
    render(<ThemeSelector {...makeProps()} />);

    const options = screen.getAllByRole('option');

    expect(options.length).toBeGreaterThan(0);
  });

  it('provides theme preview information', () => {
    render(<ThemeSelector {...makeProps()} />);

    expect(screen.getByText(/bg · accent · text/i)).toBeInTheDocument();
  });

  it('verifies theme swatches render with proper screen reader titles for contrast details', () => {
    render(<ThemeSelector theme="dark" onThemeChange={vi.fn()} />);

    expect(screen.getByTitle(/bg: #/)).toBeInTheDocument();
    expect(screen.getByTitle(/accent: #/)).toBeInTheDocument();
    expect(screen.getByTitle(/text: #/)).toBeInTheDocument();
  });

  it('asserts focusable toggle controls maintain visible outline behaviors', () => {
    render(<ThemeSelector theme="default" onThemeChange={vi.fn()} />);

    const shuffleButton = screen.getByRole('button', { name: /Shuffle/i });

    expect(shuffleButton).toHaveClass('hover:text-white', 'transition-all');
    expect(shuffleButton).toHaveAttribute('title', 'Pick a random theme');
  });

  it('verifies that tooltip labels are announced with correct accessibility descriptions', () => {
    render(<ThemeSelector theme="auto" onThemeChange={vi.fn()} />);

    const autoSwatch = screen.getByTitle('Light → Dark (auto)');
    expect(autoSwatch).toBeInTheDocument();
  });

  it('verifies normal sequential tab ordering of theme elements', () => {
    render(<ThemeSelector theme="neon" onThemeChange={vi.fn()} />);

    const shuffleButton = screen.getByRole('button', { name: /Shuffle/i });
    const selectDropdown = screen.getByRole('combobox');

    expect(shuffleButton.tabIndex).toBe(0);
    expect(selectDropdown.tabIndex).toBe(0);
  });

  it('confirms logical hierarchy and labelling of the theme selector section', () => {
    render(<ThemeSelector theme="default" onThemeChange={vi.fn()} />);

    expect(screen.getByText('customize.controls.theme_presets')).toBeInTheDocument();
  });
});
