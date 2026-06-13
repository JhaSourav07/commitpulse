import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ThemeSelector } from './ThemeSelector';

vi.mock('./ThemeQuickPresets', () => ({
  ThemeQuickPresets: () => <div data-testid="theme-quick-presets" />,
}));

vi.mock('./SectionLabel', () => ({
  SectionLabel: ({ children }: { children: ReactNode }) => <span>{children}</span>,
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
});
