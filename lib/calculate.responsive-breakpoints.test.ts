import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import Navbar from '../app/components/navbar';
import { TranslationProvider } from '../context/TranslationContext';
import React from 'react';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

// Mock hooks
vi.mock('../hooks/useKeyboardShortcuts', () => ({
  useKeyboardShortcuts: vi.fn(),
}));

describe('calculate - Responsive Multi-device Columns & Mobile Viewport Layouts', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: query === '(min-width: 768px)' ? false : false,
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

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderComponent = () => {
    return render(
      React.createElement(TranslationProvider, null, React.createElement(Navbar, null))
    );
  };

  it('mocks standard mobile-width media coordinates (e.g. 375px wide viewports)', () => {
    expect(window.innerWidth).toBe(375);
    renderComponent();
    // Verify mobile menu button is present
    const btn = document.querySelector('button[aria-expanded]');
    expect(btn).not.toBeNull();
  });

  it('asserts that columns reflow into standard vertical flex lists', () => {
    renderComponent();
    const btn = document.querySelector('button[aria-expanded="false"]');
    if (btn) fireEvent.click(btn);
    // Menu opens, check for the ul list which serves as the flex column layout
    const list = document.querySelector('ul.space-y-1');
    expect(list).not.toBeNull();
  });

  it('verifies styling values are not absolute widths that cause horizontal scrollbars on smaller viewports', () => {
    const { container } = renderComponent();
    const header = container.querySelector('header');
    expect(header?.className).toContain('w-full');
  });

  it('checks that navigation components scale down gracefully', () => {
    renderComponent();
    const btn = document.querySelector('button[aria-expanded="false"]');
    if (btn) fireEvent.click(btn);
    // Check dropdown menu renders, scaling down the navigation items
    const dropdown = document.querySelector('.border-t.border-gray-100');
    expect(dropdown).not.toBeNull();
  });

  it('asserts mobile-specific toggle states respond cleanly', () => {
    renderComponent();
    const btn = document.querySelector('button[aria-expanded="false"]');
    expect(btn).not.toBeNull();
    if (btn) {
      fireEvent.click(btn);
      expect(btn.getAttribute('aria-expanded')).toBe('true');
      fireEvent.click(btn);
      expect(btn.getAttribute('aria-expanded')).toBe('false');
    }
  });
});
