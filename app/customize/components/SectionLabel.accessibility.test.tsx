import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { SectionLabel } from './SectionLabel';

describe('SectionLabel Accessibility Standards & Screen Reader Aria Compliance', () => {
  it('renders accessible text content for screen readers', () => {
    render(<SectionLabel>Theme Preset</SectionLabel>);

    expect(screen.getByText('Theme Preset')).toBeInTheDocument();
  });

  it('uses a semantic paragraph element', () => {
    render(<SectionLabel>Theme Preset</SectionLabel>);

    const element = screen.getByText('Theme Preset');

    expect(element.tagName.toLowerCase()).toBe('p');
  });

  it('does not expose unnecessary aria-label attributes', () => {
    render(<SectionLabel>Theme Preset</SectionLabel>);

    const element = screen.getByText('Theme Preset');

    expect(element).not.toHaveAttribute('aria-label');
  });

  it('does not expose unnecessary aria-labelledby or aria-describedby attributes', () => {
    render(<SectionLabel>Theme Preset</SectionLabel>);

    const element = screen.getByText('Theme Preset');

    expect(element).not.toHaveAttribute('aria-labelledby');
    expect(element).not.toHaveAttribute('aria-describedby');
  });

  it('is not keyboard focusable and remains static text content', () => {
    render(<SectionLabel>Theme Preset</SectionLabel>);

    const element = screen.getByText('Theme Preset');

    expect(element).not.toHaveAttribute('tabindex');
    expect(element).not.toHaveAttribute('tabIndex');
  });

  it('does not participate in keyboard tab order', () => {
    render(<SectionLabel>Theme Preset</SectionLabel>);

    const element = screen.getByText('Theme Preset');

    expect(element).not.toHaveAttribute('tabindex');
  });

  it('is not exposed as a heading element', () => {
    render(<SectionLabel>Theme Preset</SectionLabel>);

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });
});
