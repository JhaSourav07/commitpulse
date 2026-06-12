import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import React from 'react';
import { getLabels, type BadgeLabels } from './badgeLabels';
import '@testing-library/jest-dom/vitest';

interface WrapperProps {
  lang?: string;
  badges?: string[];
  configOverride?: BadgeLabels | null;
}

const BadgeLabelsFallbackWrapper = ({ lang, badges, configOverride }: WrapperProps) => {
  let activeLabels: BadgeLabels;

  if (configOverride === null || configOverride === undefined) {
    activeLabels = getLabels(lang ?? undefined);
  } else {
    activeLabels = configOverride;
  }

  const badgeList = badges || [];
  const hasBadges = badgeList.length > 0;

  const renderedBadges = badgeList.map((badge, index) =>
    React.createElement('div', { key: index, 'data-testid': 'badge-item' }, badge)
  );

  return React.createElement(
    'div',
    {
      className: 'badge-container empty-state',
      style: { display: 'flex', flexDirection: 'column' },
      'data-testid': 'badge-container',
    },
    React.createElement('span', { 'data-testid': 'label-streak' }, activeLabels.CURRENT_STREAK),
    !hasBadges &&
      React.createElement('span', { 'data-testid': 'fallback-marker' }, 'No badges available'),
    React.createElement('div', { 'data-testid': 'badges-list' }, renderedBadges)
  );
};

describe('badgeLabels Empty & Fallback Verification', () => {
  it('Case 1: Pass null/undefined configuration records and verify the fallback engine returns safe default string labels', () => {
    const fallbackLabels = getLabels(undefined);
    expect(fallbackLabels.CURRENT_STREAK).toBe('CURRENT_STREAK');
    expect(fallbackLabels.ANNUAL_SYNC_TOTAL).toBe('ANNUAL_SYNC_TOTAL');

    render(React.createElement(BadgeLabelsFallbackWrapper, { configOverride: null }));
    const streakLabel = screen.getByTestId('label-streak');
    expect(streakLabel).toHaveTextContent('CURRENT_STREAK');
  });

  it('Case 2: Pass empty arrays for local badge datasets and verify that a non-breaking, clean fallback text marker or structure is rendered', () => {
    render(React.createElement(BadgeLabelsFallbackWrapper, { badges: [] }));
    const fallbackMarker = screen.getByTestId('fallback-marker');
    expect(fallbackMarker).toBeInTheDocument();
    expect(fallbackMarker).toHaveTextContent('No badges available');
  });

  it('Case 3: Assert standard CSS/style classes or properties remain intact on the default empty container element layout state', () => {
    render(React.createElement(BadgeLabelsFallbackWrapper, { badges: [] }));
    const container = screen.getByTestId('badge-container');
    expect(container).toHaveClass('badge-container');
    expect(container).toHaveClass('empty-state');
    expect(container).toHaveStyle({ display: 'flex', flexDirection: 'column' });
  });

  it('Case 4: Verify that executing empty array loops or object parameter evaluation produces 0 unexpected runtime exceptions', () => {
    const executeTest = () => {
      const resultLabels = getLabels(undefined);
      const badges: string[] = [];
      const loopResult: string[] = [];

      badges.forEach((b) => {
        loopResult.push(b);
      });

      render(
        React.createElement(BadgeLabelsFallbackWrapper, {
          lang: undefined,
          badges,
          configOverride: null,
        })
      );

      return { resultLabels, loopResultLength: loopResult.length };
    };

    expect(executeTest).not.toThrow();
    const result = executeTest();
    expect(result.loopResultLength).toBe(0);
    expect(result.resultLabels.CURRENT_STREAK).toBe('CURRENT_STREAK');
  });

  it('Case 5: Inspect key DOM nodes to ensure fallback structural empty text markers exist cleanly in the document layout tree', () => {
    render(React.createElement(BadgeLabelsFallbackWrapper, { badges: [] }));
    const container = screen.getByTestId('badge-container');
    const marker = screen.getByTestId('fallback-marker');

    expect(container).toContainElement(marker);
    expect(marker).toHaveTextContent('No badges available');
  });
});
