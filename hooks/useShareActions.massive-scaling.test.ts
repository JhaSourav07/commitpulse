import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { useShareActions } from './useShareActions';
import type { DashboardExportData } from '@/types/dashboard';

vi.mock('html-to-image', () => ({
  toPng: vi.fn().mockResolvedValue('data:image/png;base64,mockPng'),
  toCanvas: vi.fn().mockResolvedValue({
    toBlob: (cb: (blob: Blob) => void) => {
      cb(new Blob(['test'], { type: 'image/png' }));
    },
    toDataURL: vi.fn().mockReturnValue('data:image/webp;base64,mockWebp'),
  }),
}));

const MASSIVE_USERNAME = 'u' + 's'.repeat(100) + 'ername';
const mockClose = vi.fn();

function buildMassiveExportData(dayCount: number): DashboardExportData {
  const startDate = new Date('2024-01-01');
  const activity = Array.from({ length: dayCount }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return {
      date: `${yyyy}-${mm}-${dd}`,
      count: i % 50,
      intensity: (i % 5) as 0 | 1 | 2 | 3 | 4,
    };
  });
  return {
    stats: { currentStreak: 365, peakStreak: 500, totalContributions: 99999 },
    languages: Array.from({ length: 50 }, (_, i) => ({
      name: `Lang${i}`,
      color: '#3178c6',
      percentage: 100 / 50,
    })),
    activity,
  };
}

let mockLinkElement: HTMLAnchorElement;
const originalCreateElement = document.createElement.bind(document);
const originalFetch = global.fetch;
const originalCreateObjectURL = global.URL.createObjectURL;
const originalRevokeObjectURL = global.URL.revokeObjectURL;

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  global.fetch = vi.fn().mockResolvedValue(new Response());
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    configurable: true,
  });
  vi.spyOn(window, 'open').mockImplementation(() => null);
  global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
  global.URL.revokeObjectURL = vi.fn();
  mockLinkElement = originalCreateElement('a') as HTMLAnchorElement;
  vi.spyOn(mockLinkElement, 'click').mockImplementation(() => undefined);
  vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
    if (tagName === 'a') return mockLinkElement;
    return originalCreateElement(tagName);
  });
  document.body.innerHTML = '<div id="dashboard-root">Dashboard</div>';
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  global.fetch = originalFetch;
  global.URL.createObjectURL = originalCreateObjectURL;
  global.URL.revokeObjectURL = originalRevokeObjectURL;
  Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
  document.body.innerHTML = '';
});

describe('useShareActions massive scaling', () => {
  it('handles thousands of activity entries in CSV export without error', () => {
    const data = buildMassiveExportData(5000);
    const { result } = renderHook(() => useShareActions(MASSIVE_USERNAME, data, mockClose));
    act(() => {
      result.current.handleDownloadCSV();
    });
    expect(mockLinkElement.download).toContain('.csv');
    expect(mockLinkElement.click).toHaveBeenCalled();
    expect(result.current.states['csv']).toBe('success');
  });

  it('handles thousands of activity entries in JSON export without error', () => {
    const data = buildMassiveExportData(5000);
    const { result } = renderHook(() => useShareActions(MASSIVE_USERNAME, data, mockClose));
    act(() => {
      result.current.handleDownloadJSON();
    });
    expect(mockLinkElement.download).toContain('.json');
    expect(mockLinkElement.click).toHaveBeenCalled();
    expect(result.current.states['json']).toBe('success');
  });

  it('handles extremely long username in filename sanitization for CSV', () => {
    const data = buildMassiveExportData(10);
    const { result } = renderHook(() => useShareActions(MASSIVE_USERNAME, data, mockClose));
    act(() => {
      result.current.handleDownloadCSV();
    });
    expect(mockLinkElement.download).toContain('.csv');
    expect(mockLinkElement.download).not.toContain('..');
    expect(result.current.states['csv']).toBe('success');
  });

  it('handles extremely long username in filename sanitization for JSON', () => {
    const data = buildMassiveExportData(10);
    const { result } = renderHook(() => useShareActions(MASSIVE_USERNAME, data, mockClose));
    act(() => {
      result.current.handleDownloadJSON();
    });
    expect(mockLinkElement.download).toContain('.json');
    expect(result.current.states['json']).toBe('success');
  });

  it('handles 50 languages without breaking CSV structure', () => {
    const data = buildMassiveExportData(1);
    const { result } = renderHook(() => useShareActions(MASSIVE_USERNAME, data, mockClose));
    act(() => {
      result.current.handleDownloadCSV();
    });
    expect(result.current.states['csv']).toBe('success');
    expect(mockLinkElement.click).toHaveBeenCalled();
  });
});
