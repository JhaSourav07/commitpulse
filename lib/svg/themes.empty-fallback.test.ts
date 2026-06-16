import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import React from 'react';
import { themes } from './themes';
import '@testing-library/jest-dom/vitest';

/**
 * lib/svg/themes.empty-fallback.test.ts
 *
 * TARGET: lib/svg/themes.ts
 * FOCUS: Edge Cases & Empty/Missing Inputs Verification
 */

// ── Fallback Wrapper Component ───────────────────────────────────────────────

/**
 * A test-only React component that exercises the themes module's data.
 * It simulates a real UI component that consumes theme constants and
 * handles potential missing or empty inputs gracefully.
 */
interface ThemeFallbackWrapperProps {
  themeName?: keyof typeof themes | null;
  customThemes?: Array<{ name: string }> | null;
}

const ThemeFallbackWrapper = ({ themeName, customThemes }: ThemeFallbackWrapperProps) => {
  // Resolve theme with safe fallback to 'dark' if themeName is missing or invalid
  const resolvedTheme = themeName && themes[themeName] ? themes[themeName] : themes.dark;

  // Handle empty or null arrays for custom themes
  const list = customThemes || [];

  return React.createElement(
    'div',
    {
      className: 'theme-container default-layout',
      style: { backgroundColor: `#${resolvedTheme.bg}`, color: `#${resolvedTheme.text}` },
      'data-testid': 'theme-container',
    },
    React.createElement(
      'span',
      { 'data-testid': 'theme-accent', style: { color: `#${resolvedTheme.accent}` } },
      'Accent Element'
    ),
    // Fallback UI for empty custom themes list
    list.length === 0 &&
      React.createElement('span', { 'data-testid': 'empty-marker' }, 'No custom themes provided'),
    React.createElement(
      'div',
      { 'data-testid': 'custom-themes-list' },
      list.map((t, idx) =>
        React.createElement('div', { key: idx, 'data-testid': 'custom-theme-item' }, t.name)
      )
    )
  );
};

// ── Tests ───────────────────────────────────────────────────────────────────

describe('themes Edge Cases & Empty/Missing Inputs Verification', () => {
  it('Case 1: Render with null/undefined theme parameters and verify fallback to default "dark" theme constants', () => {
    // We pass null to simulate a missing themeName parameter
    render(React.createElement(ThemeFallbackWrapper, { themeName: null }));

    const container = screen.getByTestId('theme-container');
    const accent = screen.getByTestId('theme-accent');

    // Verify styles reference themes.dark values directly
    expect(container).toHaveStyle({
      backgroundColor: `#${themes.dark.bg}`,
    });

    expect(container).toHaveStyle({
      color: `#${themes.dark.text}`,
    });

    expect(accent).toHaveStyle({
      color: `#${themes.dark.accent}`,
    });
  });

  it('Case 2: Pass an empty array for custom theme collections and verify that a clear, non-breaking fallback UI marker is displayed', () => {
    render(React.createElement(ThemeFallbackWrapper, { customThemes: [] }));

    const emptyMarker = screen.getByTestId('empty-marker');
    expect(emptyMarker).toBeInTheDocument();
    expect(emptyMarker).toHaveTextContent('No custom themes provided');

    // List should be empty
    const customList = screen.getByTestId('custom-themes-list');
    expect(customList).toBeEmptyDOMElement();
  });

  it('Case 3: Verify standard styles and layout classes are maintained in the default empty layout state', () => {
    render(React.createElement(ThemeFallbackWrapper, { customThemes: null }));

    const container = screen.getByTestId('theme-container');
    expect(container).toHaveClass('theme-container');
    expect(container).toHaveClass('default-layout');

    // Check that styles are still applied from the fallback theme
    expect(container).toHaveStyle({
      backgroundColor: `#${themes.dark.bg}`,
    });
  });

  it('Case 4: Assert that no unexpected runtime errors or exceptions occur during rendering with missing or empty parameters', () => {
    const renderTest = () => {
      render(
        React.createElement(ThemeFallbackWrapper, {
          themeName: undefined,
          customThemes: null,
        })
      );
    };

    expect(renderTest).not.toThrow();
  });

  it('Case 5: Check key DOM structures to ensure empty fallback markers exist cleanly in the document layout tree', () => {
    const { container: domRoot } = render(
      React.createElement(ThemeFallbackWrapper, { customThemes: [] })
    );

    const container = screen.getByTestId('theme-container');
    const marker = screen.getByTestId('empty-marker');
    const customList = screen.getByTestId('custom-themes-list');

    expect(container).toContainElement(marker);
    expect(container).toContainElement(customList);

    // Ensure standard marker is present for the empty list
    expect(domRoot.querySelector('[data-testid="empty-marker"]')).not.toBeNull();
  });
});
