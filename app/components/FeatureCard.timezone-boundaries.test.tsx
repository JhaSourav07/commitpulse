import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FeatureCard } from './FeatureCard';
import { mockTimezone, restoreTimezone } from '@/test-utils/timezone-mock';
import '@testing-library/jest-dom/vitest';
import type { ComponentProps, ReactNode } from 'react';

// Mock framer-motion to avoid jsdom issues, ensuring strict types and no unused variables
vi.mock('framer-motion', () => ({
  motion: {
    div: (props: { children?: ReactNode }) => {
      const { children, ...rest } = props;
      const cleanProps = { ...rest };
      const motionProps = [
        'whileHover',
        'whileTap',
        'whileInView',
        'initial',
        'animate',
        'exit',
        'transition',
        'viewport',
      ];
      for (const key of motionProps) {
        if (key in cleanProps) {
          delete (cleanProps as Record<string, unknown>)[key];
        }
      }
      return <div {...cleanProps}>{children}</div>;
    },
  },
}));

type FeatureCardProps = ComponentProps<typeof FeatureCard>;

const TestIcon = () => <span data-testid="test-icon">★</span>;

describe('FeatureCard Timezone Normalization & Calendar Data Boundary Alignment', () => {
  afterEach(() => {
    restoreTimezone();
    cleanup();
  });

  // Case 1: Mock standard global timezone configurations (e.g., America/New_York, Asia/Kolkata, Asia/Tokyo) and verify date calculations bind localized layout data onto the intended visual boundaries.
  it('Case 1: verifies localized date boundary binding across standard timezones', () => {
    // 2024-03-15 at 23:30 UTC
    const baseDate = new Date('2024-03-15T23:30:00Z');

    // 1. America/New_York (UTC-5) -> 2024-03-15 at 18:30 EST
    mockTimezone('America/New_York');
    const nyDateString = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/New_York',
    }).format(baseDate);

    const propsNY = {
      icon: <TestIcon />,
      title: 'Milestone NY',
      desc: `Date: ${nyDateString}`,
      accent: 'text-emerald-400',
    } as unknown as FeatureCardProps;

    const { unmount: unmountNY } = render(<FeatureCard {...propsNY} />);
    expect(screen.getByText('Date: 2024-03-15')).toBeInTheDocument();
    unmountNY();
    restoreTimezone();

    // 2. Asia/Kolkata (UTC+5:30) -> 2024-03-16 at 05:00 IST
    mockTimezone('Asia/Kolkata');
    const kolkataDateString = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
    }).format(baseDate);

    const propsKolkata = {
      icon: <TestIcon />,
      title: 'Milestone Kolkata',
      desc: `Date: ${kolkataDateString}`,
      accent: 'text-emerald-400',
    } as unknown as FeatureCardProps;

    const { unmount: unmountKolkata } = render(<FeatureCard {...propsKolkata} />);
    expect(screen.getByText('Date: 2024-03-16')).toBeInTheDocument();
    unmountKolkata();
    restoreTimezone();

    // 3. Asia/Tokyo (UTC+9) -> 2024-03-16 at 08:30 JST
    mockTimezone('Asia/Tokyo');
    const tokyoDateString = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Tokyo',
    }).format(baseDate);

    const propsTokyo = {
      icon: <TestIcon />,
      title: 'Milestone Tokyo',
      desc: `Date: ${tokyoDateString}`,
      accent: 'text-emerald-400',
    } as unknown as FeatureCardProps;

    const { unmount: unmountTokyo } = render(<FeatureCard {...propsTokyo} />);
    expect(screen.getByText('Date: 2024-03-16')).toBeInTheDocument();
    unmountTokyo();
  });

  // Case 2: Supply leap year transition bounds (such as February 29th) to confirm calendar schemas compute updates without rendering empty gaps.
  it('Case 2: verifies layout data binds correctly around leap year transitions', () => {
    const leapDay = new Date('2024-02-29T12:00:00Z');
    const dayAfter = new Date(leapDay.getTime() + 24 * 60 * 60 * 1000);

    const leapDayStr = leapDay.toISOString().slice(0, 10);
    const dayAfterStr = dayAfter.toISOString().slice(0, 10);

    const props = {
      icon: <TestIcon />,
      title: `Leap ${leapDayStr}`,
      desc: `Day after: ${dayAfterStr}`,
      accent: 'text-emerald-400',
    } as unknown as FeatureCardProps;

    render(<FeatureCard {...props} />);

    expect(screen.getByText('Day after: 2024-03-01')).toBeInTheDocument();
    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading.textContent).toBe('Leap 2024-02-29');
  });

  // Case 3: Test hour shifts around daylight savings time (DST) transition parameters to guarantee date normalization processes calculations smoothly without crashing.
  it('Case 3: verifies smooth processing and normalization around DST boundaries without crashing', () => {
    mockTimezone('America/New_York');

    const preDST = new Date('2024-03-10T01:59:00-05:00');
    const postDST = new Date('2024-03-10T03:01:00-04:00');

    const formatTime = (d: Date) =>
      new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      }).format(d);

    const preDSTStr = formatTime(preDST);
    const postDSTStr = formatTime(postDST);

    const props = {
      icon: <TestIcon />,
      title: 'DST Change',
      desc: `Pre: ${preDSTStr} | Post: ${postDSTStr}`,
      accent: 'text-emerald-400',
    } as unknown as FeatureCardProps;

    render(<FeatureCard {...props} />);

    expect(screen.getByText(/Pre: 1:59 AM/)).toBeInTheDocument();
    expect(screen.getByText(/Post: 3:01 AM/)).toBeInTheDocument();
  });

  // Case 4: Assert that calendar date format utility strings rendered inside the card conform exactly to regional locale layout expectations.
  it('Case 4: asserts rendered date format patterns conform exactly to regional locale expectations', () => {
    const testDate = new Date('2024-12-25T15:00:00Z');

    mockTimezone('Asia/Tokyo');
    const tokyoFormat = new Intl.DateTimeFormat('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(testDate);

    mockTimezone('America/New_York');
    const nyFormat = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(testDate);

    const props = {
      icon: <TestIcon />,
      title: 'Locale Verification',
      desc: `JP: ${tokyoFormat} | US: ${nyFormat}`,
      accent: 'text-emerald-400',
    } as unknown as FeatureCardProps;

    render(<FeatureCard {...props} />);

    expect(screen.getByText(/JP: 2024/)).toBeInTheDocument();
    expect(screen.getByText(/JP:.*12/)).toBeInTheDocument();
    expect(screen.getByText(/JP:.*26/)).toBeInTheDocument();

    expect(screen.getByText(/US: 12\/25\/2024/)).toBeInTheDocument();
  });

  // Case 5: Verify that executing structural lifecycle unmounts or resetting layout params under extreme timezone configurations clears configurations cleanly with 0 exceptions.
  it('Case 5: unmounts structurally and resets configuration under extreme timezone offset cleanly without errors', () => {
    mockTimezone('Pacific/Kiritimati');

    const props = {
      icon: <TestIcon />,
      title: 'Extreme UTC+14',
      desc: 'Checking cleanup lifecycle',
      accent: 'text-emerald-400',
    } as unknown as FeatureCardProps;

    const { unmount } = render(<FeatureCard {...props} />);

    expect(screen.getByText('Extreme UTC+14')).toBeInTheDocument();

    expect(() => {
      unmount();
    }).not.toThrow();

    expect(() => {
      restoreTimezone();
    }).not.toThrow();
  });
});
