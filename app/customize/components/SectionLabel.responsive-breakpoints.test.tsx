import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SectionLabel } from './SectionLabel';
import React from 'react';

describe('SectionLabel Responsive Breakpoints', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query.includes('375px'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it('renders correctly on a standard mobile viewport (375px)', () => {
    render(<SectionLabel>Theme Presets</SectionLabel>);

    expect(screen.getByText('Theme Presets')).toBeInTheDocument();
  });

  it('uses responsive typography classes instead of fixed widths', () => {
    render(<SectionLabel>Appearance</SectionLabel>);

    const label = screen.getByText('Appearance');

    expect(label.className).toContain('text-[10px]');
    expect(label.className).not.toContain('w-');
    expect(label.className).not.toContain('min-w-');
    expect(label.className).not.toContain('max-w-');
  });

  it('maintains layout without horizontal overflow classes', () => {
    render(<SectionLabel>Responsive Label</SectionLabel>);

    const label = screen.getByText('Responsive Label');

    expect(label.className).not.toContain('overflow-x');
    expect(label.className).not.toContain('whitespace-nowrap');
  });

  it('renders consistently after rerendering with new content', () => {
    const { rerender } = render(<SectionLabel>First Label</SectionLabel>);

    rerender(<SectionLabel>Second Label</SectionLabel>);

    expect(screen.getByText('Second Label')).toBeInTheDocument();
  });

  it('supports long labels without crashing on mobile viewports', () => {
    render(
      <SectionLabel>
        This is a very long section label used to verify responsive rendering on smaller mobile
        screens.
      </SectionLabel>
    );

    expect(screen.getByText(/This is a very long section label/i)).toBeInTheDocument();
  });
});
