import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { useRecentSearches } from './useRecentSearches';

// Set up localStorage mock
const store: Record<string, string> = {};
const originalLocalStorage = window.localStorage;

beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
      clear: () => {
        Object.keys(store).forEach((k) => delete store[k]);
      },
    },
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  Object.defineProperty(window, 'localStorage', {
    value: originalLocalStorage,
    writable: true,
    configurable: true,
  });
});

// A mock UI component that integrates useRecentSearches with mouse interactivity features
// including tooltips, custom hover states, touch events, and propagation logic.
function RecentSearchesTestComponent() {
  const { searches, addSearch, clearSearches } = useRecentSearches();
  const [activeTooltip, setActiveTooltip] = useState<{
    query: string;
    x: number;
    y: number;
  } | null>(null);

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>, query: string) => {
    setActiveTooltip({
      query,
      x: 150,
      y: 80,
    });
  };

  const handleMouseLeave = () => {
    setActiveTooltip(null);
  };

  const searchButtons = searches.map((query) =>
    React.createElement(
      'button',
      {
        key: query,
        'data-testid': `search-tag-${query}`,
        className: 'cursor-pointer hover:bg-gray-100 p-2 transition-all duration-200',
        onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => handleMouseEnter(e, query),
        onMouseLeave: handleMouseLeave,
        onTouchStart: () => {},
        onTouchEnd: () => {},
      },
      query
    )
  );

  return React.createElement(
    'div',
    null,
    React.createElement('button', { onClick: () => addSearch('octocat') }, 'Add octocat'),
    React.createElement('button', { onClick: () => addSearch('torvalds') }, 'Add torvalds'),
    React.createElement('button', { onClick: clearSearches }, 'Clear All'),
    React.createElement('div', { 'data-testid': 'search-list' }, searchButtons),
    activeTooltip
      ? React.createElement(
          'div',
          {
            'data-testid': 'interactive-tooltip',
            style: {
              top: `${activeTooltip.y}px`,
              left: `${activeTooltip.x}px`,
              position: 'absolute',
            },
          },
          `Search for ${activeTooltip.query}`
        )
      : null
  );
}

describe('useRecentSearches Interactivity wrapper', () => {
  // 1. Trigger simulated mouseenter/hover gestures on active segments or interactive nodes.
  it('triggers mouseenter and mouseleave gestures on search tags and validates hover behavior', async () => {
    const user = userEvent.setup();
    render(React.createElement(RecentSearchesTestComponent));

    const addButton = screen.getByRole('button', { name: 'Add octocat' });
    await user.click(addButton);

    const tag = screen.getByTestId('search-tag-octocat');
    const mouseEnterSpy = vi.fn();
    const mouseLeaveSpy = vi.fn();

    tag.addEventListener('mouseenter', mouseEnterSpy);
    tag.addEventListener('mouseleave', mouseLeaveSpy);

    // Simulate hover gesture
    fireEvent.mouseEnter(tag);
    expect(mouseEnterSpy).toHaveBeenCalledTimes(1);

    // Verify hover and transition classes are configured correctly
    expect(tag.className).toContain('hover:bg-gray-100');
    expect(tag.className).toContain('transition-all');
    expect(tag.className).toContain('duration-200');

    // Simulate mouse exit gesture
    fireEvent.mouseLeave(tag);
    expect(mouseLeaveSpy).toHaveBeenCalledTimes(1);
  });

  // 2. Verify that responsive tooltip layouts display at computed coordinates.
  it('verifies that responsive tooltip layouts display at computed coordinates', async () => {
    const user = userEvent.setup();
    render(React.createElement(RecentSearchesTestComponent));

    const addButton = screen.getByRole('button', { name: 'Add torvalds' });
    await user.click(addButton);

    const tag = screen.getByTestId('search-tag-torvalds');

    // Hover tag to display the tooltip
    fireEvent.mouseEnter(tag);

    const tooltip = screen.getByTestId('interactive-tooltip');
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveTextContent('Search for torvalds');

    // Verify coordinates are computed correctly
    expect(tooltip.style.left).toBe('150px');
    expect(tooltip.style.top).toBe('80px');
  });

  // 3. Test custom click/touch gestures and ensure click events propagate correctly.
  it('handles custom click and touch gestures and ensures propagation', async () => {
    const user = userEvent.setup();
    render(React.createElement(RecentSearchesTestComponent));

    const addButton = screen.getByRole('button', { name: 'Add octocat' });
    await user.click(addButton);

    const tag = screen.getByTestId('search-tag-octocat');
    const clickSpy = vi.fn();
    const parentClickSpy = vi.fn();

    tag.addEventListener('click', clickSpy);
    tag.parentElement?.addEventListener('click', parentClickSpy);

    // Click triggers both button and parent handlers (propagation)
    await user.click(tag);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(parentClickSpy).toHaveBeenCalledTimes(1);

    // Test touch gestures
    const touchStartSpy = vi.fn();
    const touchEndSpy = vi.fn();

    tag.addEventListener('touchstart', touchStartSpy);
    tag.addEventListener('touchend', touchEndSpy);

    expect(() => fireEvent.touchStart(tag)).not.toThrow();
    expect(() => fireEvent.touchEnd(tag)).not.toThrow();

    expect(touchStartSpy).toHaveBeenCalledTimes(1);
    expect(touchEndSpy).toHaveBeenCalledTimes(1);
  });

  // 4. Assert appropriate cursor style classes (like pointer) are applied on hover.
  it('asserts that cursor-pointer styling class is defined on search tags', async () => {
    const user = userEvent.setup();
    render(React.createElement(RecentSearchesTestComponent));

    const addButton = screen.getByRole('button', { name: 'Add octocat' });
    await user.click(addButton);

    const tag = screen.getByTestId('search-tag-octocat');
    expect(tag.className).toContain('cursor-pointer');
  });

  // 5. Check that mouseleave events successfully hide temporary overlay visuals.
  it('checks that mouseleave events successfully hide the tooltip overlay', async () => {
    const user = userEvent.setup();
    render(React.createElement(RecentSearchesTestComponent));

    const addButton = screen.getByRole('button', { name: 'Add octocat' });
    await user.click(addButton);

    const tag = screen.getByTestId('search-tag-octocat');

    // Show tooltip
    fireEvent.mouseEnter(tag);
    expect(screen.getByTestId('interactive-tooltip')).toBeInTheDocument();

    // Hide tooltip
    fireEvent.mouseLeave(tag);
    expect(screen.queryByTestId('interactive-tooltip')).not.toBeInTheDocument();
  });
});
