import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SectionLabel } from './SectionLabel';

describe('SectionLabel', () => {
  it('renders the children text content', () => {
    render(<SectionLabel>Theme Preset</SectionLabel>);
    expect(screen.getByText('Theme Preset')).toBeDefined();
  });

  it('renders a <p> element', () => {
    render(<SectionLabel>Test Label</SectionLabel>);
    const el = screen.getByText('Test Label');
    expect(el.tagName).toBe('P');
  });

  it('<p> has the text-white/45 class', () => {
    render(<SectionLabel>Test Label</SectionLabel>);
    const el = screen.getByText('Test Label');
    expect(el.className).toContain('text-gray-600');
  });

  it('<p> has the uppercase class', () => {
    render(<SectionLabel>Test Label</SectionLabel>);
    const el = screen.getByText('Test Label');
    expect(el.className).toContain('uppercase');
  });

  it('renders with special characters without crashing', () => {
    render(<SectionLabel>{'!@#$%^&*()'}</SectionLabel>);
    expect(screen.getByText('!@#$%^&*()')).toBeDefined();
  });
});
