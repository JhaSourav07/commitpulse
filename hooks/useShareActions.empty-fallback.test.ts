import { render, screen, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';
import { useShareActions } from './useShareActions';
import type { DashboardExportData } from '@/types/dashboard';

vi.mock('html-to-image', () => ({
  toPng: vi.fn().mockResolvedValue('data:image/png;base64,mockPng'),
  toCanvas: vi.fn().mockResolvedValue({
    toBlob: (cb: (blob: Blob | null) => void) => cb(new Blob(['test'], { type: 'image/png' })),
    toDataURL: vi.fn().mockReturnValue('data:image/webp;base64,mockWebp'),
  }),
}));

const baseExportData: DashboardExportData = {
  stats: { currentStreak: 5, peakStreak: 12, totalContributions: 142 },
  languages: [{ name: 'TypeScript', color: '#3178c6', percentage: 80 }],
  activity: [{ date: '2026-06-01', count: 5, intensity: 2, locAdditions: 150, locDeletions: 50 }],
};

function TestHarness({
  username,
  exportData,
}: {
  username: string;
  exportData: DashboardExportData;
}) {
  const { states, handleCopyLink, handleTwitter, handleDownloadCSV, handleDownloadJSON } =
    useShareActions(username, exportData, vi.fn());

  return React.createElement(
    'div',
    null,
    React.createElement('button', {
      onClick: handleCopyLink,
      'data-testid': 'copy-link',
      'aria-busy': states['copy'] === 'loading',
    }),
    React.createElement('button', {
      onClick: handleTwitter,
      'data-testid': 'share-twitter',
    }),
    React.createElement('button', {
      onClick: handleDownloadCSV,
      'data-testid': 'download-csv',
      'aria-busy': states['csv'] === 'loading',
    }),
    React.createElement('button', {
      onClick: handleDownloadJSON,
      'data-testid': 'download-json',
      'aria-busy': states['json'] === 'loading',
    })
  );
}

describe('useShareActions Empty / Missing Inputs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
      writable: true,
    });
    vi.spyOn(window, 'open').mockImplementation(() => null);
  });

  it('handles empty username string without crashing', () => {
    render(React.createElement(TestHarness, { username: '', exportData: baseExportData }));
    expect(screen.getByTestId('copy-link')).toBeDefined();
  });

  it('handles username with special characters safely', () => {
    render(
      React.createElement(TestHarness, {
        username: '../ malicious\nuser',
        exportData: baseExportData,
      })
    );
    expect(screen.getByTestId('share-twitter')).toBeDefined();
  });

  it('handles exportData with empty stats gracefully', () => {
    const emptyStats = {
      stats: { currentStreak: 0, peakStreak: 0, totalContributions: 0 },
      languages: [],
    } as unknown as DashboardExportData;
    render(React.createElement(TestHarness, { username: 'testuser', exportData: emptyStats }));
    expect(screen.getByTestId('download-csv')).toBeDefined();
  });

  it('handles exportData with null activity gracefully', () => {
    const noActivity = {
      stats: { currentStreak: 5, peakStreak: 12, totalContributions: 142 },
      activity: null,
    } as unknown as DashboardExportData;
    render(React.createElement(TestHarness, { username: 'testuser', exportData: noActivity }));
    expect(screen.getByTestId('download-csv')).toBeDefined();
  });

  it('handles undefined languages without error', () => {
    const noLangs = {
      stats: { currentStreak: 5, peakStreak: 12, totalContributions: 142 },
    } as unknown as DashboardExportData;
    render(React.createElement(TestHarness, { username: 'testuser', exportData: noLangs }));
    expect(screen.getByTestId('download-json')).toBeDefined();
  });
});
