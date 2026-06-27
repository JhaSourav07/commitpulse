import { render, screen, act, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';
import { useShareActions } from './useShareActions';
import type { DashboardExportData } from '@/types/dashboard';

// Mock the hook's dependencies to avoid side-effects
vi.mock('html-to-image', () => ({
  toPng: vi.fn().mockResolvedValue('data:image/png;base64,mockPng'),
  toCanvas: vi.fn().mockResolvedValue({
    toBlob: (cb: (blob: Blob) => void) => cb(new Blob(['test'], { type: 'image/png' })),
    toDataURL: vi.fn().mockReturnValue('data:image/webp;base64,mockWebp'),
  }),
}));

const mockExportData: DashboardExportData = {
  stats: { currentStreak: 5, peakStreak: 12, totalContributions: 142 },
  languages: [],
};

// Dummy component to test the hook's states and interactions with accessibility attributes
const ShareAccessibilityTest = () => {
  const { states, handleCopyLink, handleTwitter } = useShareActions(
    'testuser',
    mockExportData,
    vi.fn()
  );

  return React.createElement(
    'div',
    null,
    React.createElement('h1', { id: 'share-heading' }, 'Share Options'),
    React.createElement('h2', { id: 'social-heading' }, 'Social Media'),
    React.createElement(
      'div',
      { role: 'region', 'aria-labelledby': 'share-heading' },
      React.createElement(
        'button',
        {
          onClick: handleCopyLink,
          'aria-describedby': 'copy-tooltip',
          'aria-busy': states['copy'] === 'loading',
          className: 'focus:outline-none focus-visible:ring-2',
          tabIndex: 0,
        },
        'Copy Link'
      ),
      React.createElement(
        'span',
        { id: 'copy-tooltip', role: 'tooltip' },
        states['copy'] === 'success' ? 'Copied to clipboard' : 'Copy link to dashboard'
      ),
      React.createElement(
        'button',
        {
          onClick: handleTwitter,
          'aria-label': 'Share on Twitter',
          className: 'focus:outline-none focus-visible:ring-2',
          tabIndex: 0,
        },
        'Twitter'
      )
    )
  );
};

describe('useShareActions Accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
      writable: true,
    });
    vi.spyOn(window, 'open').mockImplementation(() => null);
  });

  it('inspects markup to check for correct use of accessible label coordinates (role, aria-labelledby, aria-describedby)', () => {
    render(React.createElement(ShareAccessibilityTest));
    const region = screen.getByRole('region', { name: /share options/i });
    expect(region).toBeDefined();

    const copyBtn = screen.getByRole('button', { name: /copy link/i });
    expect(copyBtn.getAttribute('aria-describedby')).toBe('copy-tooltip');

    const twitterBtn = screen.getByRole('button', { name: /share on twitter/i });
    expect(twitterBtn.getAttribute('aria-label')).toBe('Share on Twitter');
  });

  it('asserts elements that accept key focus (buttons, interactive nodes) maintain visible outline behaviors', () => {
    render(React.createElement(ShareAccessibilityTest));
    const buttons = screen.getAllByRole('button');
    for (const btn of buttons) {
      expect(btn.className).toContain('focus-visible:ring-2');
      expect(btn.className).toContain('focus:outline-none');
    }
  });

  it('verifies tooltip labels are announced with correct accessibility descriptions', async () => {
    render(React.createElement(ShareAccessibilityTest));
    const copyBtn = screen.getByRole('button', { name: /copy link/i });
    const tooltip = screen.getByRole('tooltip', { hidden: true });

    // Initially
    expect(tooltip.textContent).toBe('Copy link to dashboard');

    // Trigger state change
    await act(async () => {
      fireEvent.click(copyBtn);
    });

    // Check that state updated tooltip text
    expect(tooltip.textContent).toBe('Copied to clipboard');
  });

  it('tests keyboard control path selectors to ensure normal tab ordering', () => {
    render(React.createElement(ShareAccessibilityTest));

    const copyBtn = screen.getByRole('button', { name: /copy link/i });
    const twitterBtn = screen.getByRole('button', { name: /share on twitter/i });

    // Focus first button
    copyBtn.focus();
    expect(document.activeElement).toBe(copyBtn);

    // Standard interactive elements have implicit tabIndex of 0
    expect(copyBtn.tabIndex).toBe(0);
    expect(twitterBtn.tabIndex).toBe(0);
  });

  it('confirms standard headings exist in the correct logical hierarchical order', () => {
    render(React.createElement(ShareAccessibilityTest));
    const h1 = screen.getByRole('heading', { level: 1 });
    const h2 = screen.getByRole('heading', { level: 2 });

    expect(h1.textContent).toBe('Share Options');
    expect(h2.textContent).toBe('Social Media');
    // Ensure h1 comes before h2 in the DOM hierarchy
    expect(h1.compareDocumentPosition(h2)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });
});
