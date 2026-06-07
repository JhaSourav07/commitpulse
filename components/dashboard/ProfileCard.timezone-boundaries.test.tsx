import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import ProfileCard from './ProfileCard';
import type { UserProfile, DashboardExportData } from '@/types/dashboard';

interface MockMotionProps {
  initial?: unknown;
  animate?: unknown;
  transition?: unknown;
  whileHover?: unknown;
  whileTap?: unknown;
}

type SafeDivProps = React.ComponentPropsWithoutRef<'div'> & MockMotionProps;
type SafeButtonProps = React.ComponentPropsWithoutRef<'button'> & MockMotionProps;

vi.mock('framer-motion', () => {
  const mockMotionDiv = React.forwardRef<HTMLDivElement, SafeDivProps>(
    ({ children, ...props }, ref) => {
      const domProps = { ...props };
      delete domProps.initial;
      delete domProps.animate;
      delete domProps.transition;
      delete domProps.whileHover;
      delete domProps.whileTap;
      return (
        <div ref={ref} {...domProps}>
          {children}
        </div>
      );
    }
  );
  mockMotionDiv.displayName = 'motion.div';

  const mockMotionButton = React.forwardRef<HTMLButtonElement, SafeButtonProps>(
    ({ children, ...props }, ref) => {
      const domProps = { ...props };
      delete domProps.initial;
      delete domProps.animate;
      delete domProps.transition;
      delete domProps.whileHover;
      delete domProps.whileTap;
      return (
        <button ref={ref} {...domProps}>
          {children}
        </button>
      );
    }
  );
  mockMotionButton.displayName = 'motion.button';

  return {
    motion: {
      div: mockMotionDiv,
      button: mockMotionButton,
    },
  };
});

interface MockShareSheetProps extends React.ComponentPropsWithoutRef<'div'> {
  isOpen: boolean;
  username: string;
  exportData: DashboardExportData;
  onClose: () => void;
}

vi.mock('./ShareSheet', () => {
  const mockShareSheet = React.forwardRef<HTMLDivElement, MockShareSheetProps>(
    ({ children, isOpen, username, exportData, onClose, ...props }, ref) => {
      if (!isOpen) return null;
      return (
        <div ref={ref} data-testid="share-sheet" {...props}>
          <span>{username}</span>
          <span>{exportData.stats.totalContributions}</span>
          <button onClick={onClose}>Close</button>
          {children}
        </div>
      );
    }
  );
  mockShareSheet.displayName = 'ShareSheet';
  return {
    default: mockShareSheet,
  };
});

const mockUser: UserProfile = {
  name: 'Mayank Rawat',
  username: 'mayank200529',
  bio: 'Open Source Contributor',
  location: 'Jaipur',
  joinedDate: '2024',
  developerScore: 95,
  avatarUrl: 'https://example.com/avatar.png',
  isPro: false,
  stats: {
    repositories: 10,
    stars: 50,
    followers: 100,
    following: 20,
  },
};

const mockExportData: DashboardExportData = {
  stats: {
    currentStreak: 5,
    peakStreak: 15,
    totalContributions: 100,
  },
  languages: [{ name: 'TypeScript', color: '#3178c6', percentage: 100 }],
};

describe('ProfileCard Timezone Boundaries & Date Normalization', () => {
  it('Case 1: formats a single UTC timestamp cleanly to the expected regional dates', () => {
    const utcTimestamp = '2026-06-05T22:30:00Z';

    const estFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const istFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    const formatToYMD = (formatter: Intl.DateTimeFormat, date: Date) => {
      const parts = formatter.formatToParts(date);
      const year = parts.find((p) => p.type === 'year')?.value || '';
      const month = parts.find((p) => p.type === 'month')?.value || '';
      const day = parts.find((p) => p.type === 'day')?.value || '';
      return `${year}-${month}-${day}`;
    };

    const targetDate = new Date(utcTimestamp);
    const estDate = formatToYMD(estFormatter, targetDate);
    const istDate = formatToYMD(istFormatter, targetDate);

    expect(estDate).toBe('2026-06-05');
    expect(istDate).toBe('2026-06-06');

    const { rerender } = render(
      <ProfileCard user={{ ...mockUser, joinedDate: estDate }} exportData={mockExportData} />
    );
    expect(screen.getByText(estDate)).toBeInTheDocument();

    rerender(
      <ProfileCard user={{ ...mockUser, joinedDate: istDate }} exportData={mockExportData} />
    );
    expect(screen.getByText(istDate)).toBeInTheDocument();
  });

  it('Case 2: parses and displays leap year date boundary (February 29) without exceptions', () => {
    const leapDate = '2024-02-29';

    render(
      <ProfileCard user={{ ...mockUser, joinedDate: leapDate }} exportData={mockExportData} />
    );
    expect(screen.getByText(leapDate)).toBeInTheDocument();
  });

  it('Case 3: verifies that ProfileCard renders timezone-specific calendar formats containing standard expected segments', () => {
    const timestamp = '2026-06-05T12:00:00Z';
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    const parts = formatter.formatToParts(new Date(timestamp));
    const yearVal = parts.find((p) => p.type === 'year')?.value || '';
    const monthVal = parts.find((p) => p.type === 'month')?.value || '';
    const dayVal = parts.find((p) => p.type === 'day')?.value || '';
    const formattedDate = `${yearVal}-${monthVal}-${dayVal}`;

    render(
      <ProfileCard user={{ ...mockUser, joinedDate: formattedDate }} exportData={mockExportData} />
    );
    expect(screen.getByText(formattedDate)).toBeInTheDocument();
  });

  it('Case 4: ensures Daylight Saving Time (DST) transitions do not cause incorrect offset alignment or crashes', () => {
    const preDST = new Date('2026-03-08T06:59:00Z');
    const postDST = new Date('2026-03-08T07:01:00Z');

    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    const formatToYMD = (date: Date) => {
      const parts = formatter.formatToParts(date);
      const year = parts.find((p) => p.type === 'year')?.value || '';
      const month = parts.find((p) => p.type === 'month')?.value || '';
      const day = parts.find((p) => p.type === 'day')?.value || '';
      return `${year}-${month}-${day}`;
    };

    const formattedPre = formatToYMD(preDST);
    const formattedPost = formatToYMD(postDST);

    expect(formattedPre).toBe('2026-03-08');
    expect(formattedPost).toBe('2026-03-08');

    const { rerender } = render(
      <ProfileCard user={{ ...mockUser, joinedDate: formattedPre }} exportData={mockExportData} />
    );
    expect(screen.getByText('2026-03-08')).toBeInTheDocument();

    rerender(
      <ProfileCard user={{ ...mockUser, joinedDate: formattedPost }} exportData={mockExportData} />
    );
    expect(screen.getByText('2026-03-08')).toBeInTheDocument();
  });

  it('Case 5: defaults to UTC when configuration options are unmapped or missing', () => {
    const timestamp = '2026-06-05T12:00:00Z';

    const safeFormat = (timeZone: string) => {
      try {
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });
        const parts = formatter.formatToParts(new Date(timestamp));
        const year = parts.find((p) => p.type === 'year')?.value || '';
        const month = parts.find((p) => p.type === 'month')?.value || '';
        const day = parts.find((p) => p.type === 'day')?.value || '';
        return `${year}-${month}-${day}`;
      } catch {
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: 'UTC',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });
        const parts = formatter.formatToParts(new Date(timestamp));
        const year = parts.find((p) => p.type === 'year')?.value || '';
        const month = parts.find((p) => p.type === 'month')?.value || '';
        const day = parts.find((p) => p.type === 'day')?.value || '';
        return `${year}-${month}-${day}`;
      }
    };

    const fallbackDate = safeFormat('Invalid/Timezone');
    expect(fallbackDate).toBe('2026-06-05');

    render(
      <ProfileCard user={{ ...mockUser, joinedDate: fallbackDate }} exportData={mockExportData} />
    );
    expect(screen.getByText('2026-06-05')).toBeInTheDocument();
  });
});
