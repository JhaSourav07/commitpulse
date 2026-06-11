import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SectionLabel } from './SectionLabel';

describe('SectionLabel Theme Contrast', () => {
  it('renders label content correctly', () => {
    render(<SectionLabel>Appearance</SectionLabel>);

    expect(screen.getByText('Appearance')).toBeInTheDocument();
  });

  it('applies light theme contrast styling', () => {
    render(<SectionLabel>Appearance</SectionLabel>);

    const label = screen.getByText('Appearance');

    expect(label).toHaveClass('text-gray-600');
  });

  it('applies dark theme contrast styling', () => {
    render(<SectionLabel>Appearance</SectionLabel>);

    const label = screen.getByText('Appearance');

    expect(label).toHaveClass('dark:text-white/60');
  });

  it('preserves typography styling across themes', () => {
    render(<SectionLabel>Appearance</SectionLabel>);

    const label = screen.getByText('Appearance');

    expect(label).toHaveClass('font-bold', 'uppercase', 'tracking-[0.22em]');
  });

  it('maintains layout spacing and visual cohesion', () => {
    render(<SectionLabel>Appearance</SectionLabel>);

    const label = screen.getByText('Appearance');

    expect(label).toHaveClass('mb-2');
    expect(label).toHaveClass('text-[10px]');
  });
});
