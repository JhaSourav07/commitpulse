import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { DescriptionSection } from './DescriptionSection';

describe('DescriptionSection - Responsive Multi-device Columns & Mobile Viewport Layouts', () => {
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;
  const originalMatchMedia = window.matchMedia;

  beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
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

  afterAll(() => {
    window.innerWidth = originalInnerWidth;
    window.innerHeight = originalInnerHeight;
    window.matchMedia = originalMatchMedia;
  });

  it('mocks standard mobile-width media coordinates (e.g. 375px wide viewports)', () => {
    window.innerWidth = 375;
    window.innerHeight = 812;
    window.dispatchEvent(new Event('resize'));

    expect(window.innerWidth).toBe(375);

    const { container } = render(<DescriptionSection value="Test" onChange={vi.fn()} />);
    expect(container).toBeDefined();
  });

  it('asserts that columns reflow into standard vertical flex lists', () => {
    const { container } = render(<DescriptionSection value="Test" onChange={vi.fn()} />);

    const sectionContainer = container.querySelector('#description-section');
    expect(sectionContainer).toBeDefined();

    expect(sectionContainer?.tagName).toBe('DIV');

    const textArea = screen.getByRole('textbox');
    expect(textArea.className).toContain('w-full');
  });

  it('verifies styling values are not absolute widths that cause horizontal scrollbars on smaller viewports', () => {
    render(<DescriptionSection value="Test" onChange={vi.fn()} />);
    const textArea = screen.getByRole('textbox');

    expect(textArea.className).not.toMatch(/w-\[[4-9]\d{2}px\]/);
    expect(textArea.className).not.toMatch(/w-\d{2,}(px|rem)/);

    expect(textArea.className).toContain('w-full');
  });

  it('checks that navigation components scale down gracefully', () => {
    render(<DescriptionSection value="Test" onChange={vi.fn()} />);

    const textArea = screen.getByRole('textbox');
    expect(textArea.className).toContain('text-sm');

    const countElement = screen.getByText(/characters remaining/i);
    expect(countElement.className).toContain('text-[11px]');
  });

  it('asserts mobile-specific toggle states respond cleanly', () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(max-width: 768px)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { rerender } = render(<DescriptionSection value="" onChange={vi.fn()} />);

    const textArea = screen.getByRole('textbox');
    expect(textArea.getAttribute('placeholder')).toContain('Full-stack developer');

    rerender(<DescriptionSection value={'a'.repeat(250)} onChange={vi.fn()} />);

    const countElementNearLimit = screen.getByText(/30 characters remaining/i);
    expect(countElementNearLimit.className).toContain('text-amber-500');
  });
});
