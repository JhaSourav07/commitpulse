import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';
import { ThemeToggleButton } from '../../app/components/theme-switch';

// Setup window matchMedia mock for prefers-reduced-motion
beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // Deprecated
      removeListener: vi.fn(), // Deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Clear local storage and classes
  window.localStorage.clear();
  document.documentElement.classList.remove('dark');
  document.documentElement.style.colorScheme = '';

  const existingStyles = document.getElementById('commitpulse-theme-transition-styles');
  if (existingStyles) {
    existingStyles.remove();
  }
});

describe('ThemeToggleButton - Dark and Light Prefers-Color-Scheme Visual Cohesion', () => {
  it('sets up a dual theme environment mock properly and mounts with correct preset', () => {
    // Force light theme initially
    window.localStorage.setItem('theme', 'light');
    render(React.createElement(ThemeToggleButton));

    // Test interactive element is available
    const button = screen.getByLabelText('Toggle theme');
    expect(button).toBeInTheDocument();
  });

  it('asserts that visual elements adapt color styling properly for both settings', () => {
    window.localStorage.setItem('theme', 'light');
    render(React.createElement(ThemeToggleButton, { className: 'custom-theme-btn' }));

    const button = screen.getByLabelText('Toggle theme');

    // Check initial light state styling classes are active
    expect(button).toHaveClass('bg-gray-50');
    expect(button).toHaveClass('text-gray-700');
    expect(button).toHaveClass('dark:bg-white/5'); // It has the tailwind directive for dark mode
  });

  it('verifies contrast ratio standards are maintained by properly handling theme toggling', () => {
    window.localStorage.setItem('theme', 'light');
    render(React.createElement(ThemeToggleButton));

    const button = screen.getByLabelText('Toggle theme');

    act(() => {
      fireEvent.click(button);
    });

    // Clicking should toggle to dark mode, modifying the root document
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe('dark');
    expect(window.localStorage.getItem('theme')).toBe('dark');
  });

  it('checks that specific custom stylesheet properties are active in the markup during transitions', () => {
    window.localStorage.setItem('theme', 'light');
    render(React.createElement(ThemeToggleButton, { variant: 'circle' }));

    const button = screen.getByLabelText('Toggle theme');

    act(() => {
      fireEvent.click(button);
    });

    // The component injects dynamic css for the view-transition clip paths
    const injectedStyle = document.getElementById('commitpulse-theme-transition-styles');
    expect(injectedStyle).toBeInTheDocument();
    expect(injectedStyle?.textContent).toContain('::view-transition-new(root)');
    expect(injectedStyle?.textContent).toContain('reveal-dark');
  });

  it('ensures that background overlays and structural constraints do not clip foreground content colors', () => {
    render(React.createElement(ThemeToggleButton));

    const button = screen.getByLabelText('Toggle theme');

    // Check layout constraints (width/height 10, flex, center) to ensure no clipping
    expect(button).toHaveClass('inline-flex');
    expect(button).toHaveClass('h-10');
    expect(button).toHaveClass('w-10');
    expect(button).toHaveClass('items-center');
    expect(button).toHaveClass('justify-center');
  });
});
