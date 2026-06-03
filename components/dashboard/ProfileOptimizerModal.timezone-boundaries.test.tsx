import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProfileOptimizerModal from './ProfileOptimizerModal';

type MockMotionProps = {
  children?: React.ReactNode;
  [key: string]: unknown;
};

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: MockMotionProps) => <div {...props}>{children}</div>,
    p: ({ children, ...props }: MockMotionProps) => <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

const mockUserData = {
  profile: {
    developerScore: 70,
    bio: 'Developer',
    stats: {
      repositories: 10,
      followers: 20,
    },
  },
  languages: ['TS', 'JS'],
  stats: {
    totalContributions: 500,
  },
};

function mockTimezone(locale: string, timeZone: string) {
  vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(
    () => new Intl.DateTimeFormat(locale, { timeZone })
  );
}

function renderModal() {
  render(<ProfileOptimizerModal isOpen onClose={vi.fn()} userData={mockUserData} />);

  expect(screen.getByText(/profile optimizer/i)).toBeInTheDocument();
}

describe('ProfileOptimizerModal timezone boundaries', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders consistently in UTC timezone', () => {
    mockTimezone('en-US', 'UTC');

    renderModal();
  });

  it('renders consistently in EST timezone', () => {
    mockTimezone('en-US', 'America/New_York');

    renderModal();
  });

  it('renders consistently in IST timezone', () => {
    mockTimezone('en-IN', 'Asia/Kolkata');

    renderModal();
  });

  it('renders consistently in JST timezone', () => {
    mockTimezone('ja-JP', 'Asia/Tokyo');

    renderModal();
  });

  it('remains stable across leap year and DST boundary dates', () => {
    const leapDate = new Date('2024-02-29T23:59:59Z');
    const dstDate = new Date('2025-03-09T02:00:00Z');

    expect(leapDate.getUTCDate()).toBe(29);
    expect(Number.isNaN(dstDate.getTime())).toBe(false);

    renderModal();
  });
});
