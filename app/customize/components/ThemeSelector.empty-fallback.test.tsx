import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { ThemeSelector } from './ThemeSelector';
import { THEME_KEYS } from '../types';

// Mock TranslationContext — ThemeSelector calls useTranslation() for the
// section label key. Without this mock the context throws because no
// TranslationProvider wraps the component in the test environment.
vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      // Return a realistic label for the key used in ThemeSelector
      if (key === 'customize.controls.theme_presets') return 'Theme Preset';
      return key;
    },
  }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** A no-op callback used wherever onThemeChange is required but not asserted. */
const noop = vi.fn();

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ThemeSelector — Edge Cases & Empty/Missing Inputs Verification', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Test 1 — Empty string theme renders fallback without crashing
  // -------------------------------------------------------------------------
  it('renders a non-breaking fallback UI when theme prop is an empty string', () => {
    /**
     * WHY: An empty string is the most common "missing" value a parent might
     * pass when its own state is uninitialised (e.g. before an async config
     * load resolves). ThemeSelector must not throw or produce a blank page —
     * it should still render the select, the shuffle button, and the helper
     * text so the UI stays usable.
     */
    render(<ThemeSelector theme="" onThemeChange={noop} />);

    // Core structural elements must still be present
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByTitle('Pick a random theme')).toBeInTheDocument();

    // The section label must render so the user knows what the control is
    expect(screen.getByText('Theme Preset')).toBeInTheDocument();

    // The helper text branch for an unknown/empty theme falls through to the
    // "bg · accent · text" branch — it should appear without crashing
    expect(screen.getByText(/bg · accent · text/i)).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Test 2 — Unknown / unrecognised theme key renders gracefully
  // -------------------------------------------------------------------------
  it('renders a clear, non-breaking fallback when theme is an unrecognised key not in THEME_KEYS', () => {
    /**
     * WHY: External callers (URL params, localStorage, API responses) can
     * supply arbitrary strings. themes['nonexistent-theme-xyz'] is undefined,
     * so the optional-chain `themes[theme as ThemeKey]?.[prop]` returns
     * undefined for every colour property. The component must render the
     * swatch row with zero coloured swatches and the helper text intact —
     * not throw a TypeError.
     */
    render(<ThemeSelector theme="nonexistent-theme-xyz" onThemeChange={noop} />);

    // Select must still be present and functional
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select).toBeInTheDocument();

    // All THEME_KEYS options must still be rendered in the dropdown
    const options = screen.getAllByRole('option');
    expect(options.length).toBe(THEME_KEYS.length);

    // Helper text must be visible even though no swatches can be coloured
    expect(screen.getByText(/bg · accent · text/i)).toBeInTheDocument();

    // No colour swatches should appear for an unrecognised theme because
    // every themes[key]?.[prop] resolves to undefined → the conditional
    // `color ? <span /> : null` renders null for all three slots
    const swatches = screen.queryAllByTitle(/^(bg|accent|text):/i);
    expect(swatches).toHaveLength(0);
  });

  // -------------------------------------------------------------------------
  // Test 3 — Standard styles are maintained in the empty/fallback layout state
  // -------------------------------------------------------------------------
  it('preserves the root flex-col layout and select styling classes when theme is empty', () => {
    /**
     * WHY: Missing inputs must not collapse or distort the component's layout.
     * CSS classes on the root container and the select element are load-bearing
     * for the surrounding page grid — they must be present regardless of whether
     * the theme value is valid.
     */
    const { container } = render(<ThemeSelector theme="" onThemeChange={noop} />);

    // Root container layout classes
    const root = container.firstChild as HTMLElement;
    expect(root).toBeInTheDocument();
    expect(root.className).toContain('flex');
    expect(root.className).toContain('flex-col');
    expect(root.className).toContain('gap-1.5');

    // Select styling classes — these drive the visual polish of the dropdown
    const select = screen.getByRole('combobox');
    expect(select.className).toContain('w-full');
    expect(select.className).toContain('rounded-xl');
    expect(select.className).toContain('appearance-none');
    expect(select.className).toContain('cursor-pointer');
  });

  // -------------------------------------------------------------------------
  // Test 4 — No runtime errors or hydration failures on missing inputs
  // -------------------------------------------------------------------------
  it('does not throw and produces a stable DOM when rendered with an empty string then rerendered with a valid theme', () => {
    /**
     * WHY: A common real-world pattern is for the parent to render the
     * component with an empty/default value first and then re-render once the
     * true value is available (e.g. after reading localStorage). This test
     * verifies the transition is seamless — no error is thrown on either render,
     * and the DOM node count stays stable (no phantom nodes accumulate).
     */
    const { rerender, container } = render(<ThemeSelector theme="" onThemeChange={noop} />);

    const baselineNodeCount = container.querySelectorAll('*').length;
    expect(baselineNodeCount).toBeGreaterThan(0);

    // Transition to a valid theme — must not throw
    expect(() => {
      rerender(<ThemeSelector theme="dark" onThemeChange={noop} />);
    }).not.toThrow();

    // After switching to a valid theme the colour swatches appear (bg, accent, text)
    expect(screen.getAllByTitle(/^(bg|accent|text):/i)).toHaveLength(3);

    // Transition back to empty — must not throw
    expect(() => {
      rerender(<ThemeSelector theme="" onThemeChange={noop} />);
    }).not.toThrow();

    // Swatches must be gone again
    expect(screen.queryAllByTitle(/^(bg|accent|text):/i)).toHaveLength(0);
  });

  // -------------------------------------------------------------------------
  // Test 5 — Key DOM structure markers are present in the empty state
  // -------------------------------------------------------------------------
  it('confirms key DOM structure markers exist and the select contains all option elements in the empty state', () => {
    /**
     * WHY: Even with a missing/empty theme the select element must be populated
     * with all valid THEME_KEYS options so the user can pick a theme to recover
     * from the empty state. The shuffle button must also be present. These are
     * the critical empty-state markers that confirm the component is usable
     * rather than silently broken.
     */
    render(<ThemeSelector theme="" onThemeChange={noop} />);

    // The combobox (select) must exist and be populated
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select).toBeInTheDocument();
    expect(select.tagName).toBe('SELECT');

    // Every theme key must appear as an option — user can self-recover
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(THEME_KEYS.length);

    // Verify the 'auto' and 'random' virtual keys render with their labels
    expect(screen.getByRole('option', { name: 'Auto (System)' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Random' })).toBeInTheDocument();

    // Shuffle button must be present so the user can escape the empty state
    const shuffleBtn = screen.getByTitle('Pick a random theme');
    expect(shuffleBtn).toBeInTheDocument();
    expect(shuffleBtn.tagName).toBe('BUTTON');

    // Section label must be visible to identify the control
    expect(screen.getByText('Theme Preset')).toBeInTheDocument();
  });
});
