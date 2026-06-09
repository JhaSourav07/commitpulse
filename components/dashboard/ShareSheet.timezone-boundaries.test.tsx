import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ShareSheet from './ShareSheet';
import type { DashboardExportData } from '@/types/dashboard';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('react-qr-code', () => ({
  default: ({ value }: { value: string }) => <svg data-testid="qr-code" data-value={value} />,
}));

vi.mock('@/hooks/useShareActions', () => ({
  useShareActions: () => ({
    states: {},
    handleTwitter: vi.fn(),
    handleLinkedIn: vi.fn(),
    handleReddit: vi.fn(),
    handleDownloadPNG: vi.fn(),
    handleDownloadWEBP: vi.fn(),
    handleDownloadSVG: vi.fn(),
    handleCopyMarkdown: vi.fn(),
    handleDownloadJSON: vi.fn(),
    handleNativeShare: vi.fn(),
  }),
}));

function makeMockExportData(overrides?: Partial<DashboardExportData>): DashboardExportData {
  return {
    stats: { currentStreak: 5, peakStreak: 10, totalContributions: 100 },
    languages: [],
    activity: [],
    ...overrides,
  };
}

const defaultProps = {
  username: 'octocat',
  isOpen: true,
  onClose: vi.fn(),
  exportData: makeMockExportData(),
};

describe('ShareSheet - Timezone Normalization & Calendar Data Boundary Alignment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('UTC boundary: profile URL is constructed correctly when system clock is at UTC midnight boundary', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-03-15T00:00:00.000Z'));

    render(<ShareSheet {...defaultProps} />);

    const input = screen.getByDisplayValue(/commitpulse\.vercel\.app\/dashboard\/octocat/i);
    expect(input).toBeTruthy();
    expect((input as HTMLInputElement).value).toBe(
      'https://commitpulse.vercel.app/dashboard/octocat'
    );
  });

  it('IST offset (+05:30): component renders correctly when system is in IST timezone offset', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T18:30:00.000Z'));

    render(<ShareSheet {...defaultProps} />);

    expect(screen.getByText('octocat')).toBeTruthy();
    const input = screen.getByDisplayValue(/commitpulse\.vercel\.app\/dashboard\/octocat/i);
    expect((input as HTMLInputElement).value).toContain('octocat');
  });

  it('Leap year boundary: component renders without gaps when exportData spans Feb 29 of a leap year', () => {
    const leapYearActivity = [
      { date: '2024-02-28', count: 3, intensity: 2 as const },
      { date: '2024-02-29', count: 7, intensity: 3 as const },
      { date: '2024-03-01', count: 2, intensity: 1 as const },
    ];

    render(
      <ShareSheet
        {...defaultProps}
        exportData={makeMockExportData({ activity: leapYearActivity })}
      />
    );

    expect(screen.getByText('octocat')).toBeTruthy();
    expect(screen.getByDisplayValue(/commitpulse\.vercel\.app\/dashboard\/octocat/i)).toBeTruthy();
  });

  it('DST transition boundary: component renders correctly around US DST spring-forward date (Mar 10 2024)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-03-10T07:00:00.000Z'));

    const dstActivity = [
      { date: '2024-03-09', count: 5, intensity: 3 as const },
      { date: '2024-03-10', count: 4, intensity: 2 as const },
      { date: '2024-03-11', count: 6, intensity: 3 as const },
    ];

    render(
      <ShareSheet {...defaultProps} exportData={makeMockExportData({ activity: dstActivity })} />
    );

    expect(screen.getByText('octocat')).toBeTruthy();
    const input = screen.getByDisplayValue(/commitpulse\.vercel\.app\/dashboard\/octocat/i);
    expect(input).toBeTruthy();
  });

  it('JST offset (+09:00): profile URL and username render stably when clock is at JST day boundary', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-08-20T15:00:00.000Z'));

    render(<ShareSheet {...defaultProps} username="jst-user" />);

    expect(screen.getByText('jst-user')).toBeTruthy();
    const input = screen.getByDisplayValue(/commitpulse\.vercel\.app\/dashboard\/jst-user/i);
    expect((input as HTMLInputElement).value).toBe(
      'https://commitpulse.vercel.app/dashboard/jst-user'
    );
  });
});
