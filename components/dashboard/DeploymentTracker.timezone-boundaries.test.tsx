// DeploymentTracker.timezone-boundaries.test.tsx
//
// Exercises the internal timeAgo() function indirectly through rendered
// output. Because timeAgo() works off Date.getTime() (an absolute UTC
// instant), the *displayed* relative label should be identical regardless
// of the system/browser timezone the test runs in. This suite uses
// vi.useFakeTimers to pin "now" and checks each unit boundary (minute,
// hour, day, week, month, year), then re-runs key cases under different
// simulated timezones to prove there's no local-time leakage.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DeploymentTracker from './DeploymentTracker';
import type { DeploymentData } from '@/types/dashboard';

/** Local mock builder, matching this repo's inline-mock convention. */
function makeDeployment(overrides: Partial<DeploymentData> = {}): DeploymentData {
  return {
    repoName: 'acme/web-app',
    repoUrl: 'https://github.com/acme/web-app',
    liveUrl: 'https://web-app.acme.dev',
    status: 'success',
    deployedAt: new Date().toISOString(),
    environment: 'production',
    workflowName: 'Vercel Production Deployment',
    ...overrides,
  };
}

/** ISO timestamp `n` seconds before `from`, for deterministic relative-time tests. */
function secondsAgoIso(seconds: number, from: Date = new Date()): string {
  return new Date(from.getTime() - seconds * 1000).toISOString();
}

const TIME_UNIT_SECONDS = {
  minute: 60,
  hour: 3600,
  day: 86400,
  week: 604800,
  month: 2592000,
  year: 31536000,
} as const;

const FIXED_NOW = new Date('2026-06-17T12:00:00.000Z');

describe('DeploymentTracker — timezone boundaries', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows "Just now" for a timestamp a few seconds in the past', () => {
    render(
      <DeploymentTracker data={[makeDeployment({ deployedAt: secondsAgoIso(5, FIXED_NOW) })]} />
    );
    expect(screen.getByText('Deployed Just now')).toBeInTheDocument();
  });

  it('shows "Just now" right at 0 seconds (deployedAt === now)', () => {
    render(<DeploymentTracker data={[makeDeployment({ deployedAt: FIXED_NOW.toISOString() })]} />);
    expect(screen.getByText('Deployed Just now')).toBeInTheDocument();
  });

  it('crosses the minute boundary: 59s -> "Just now", 60s -> "1 minute ago"', () => {
    const { unmount } = render(
      <DeploymentTracker data={[makeDeployment({ deployedAt: secondsAgoIso(59, FIXED_NOW) })]} />
    );
    expect(screen.getByText('Deployed Just now')).toBeInTheDocument();
    unmount();

    render(
      <DeploymentTracker data={[makeDeployment({ deployedAt: secondsAgoIso(60, FIXED_NOW) })]} />
    );
    expect(screen.getByText('Deployed 1 minute ago')).toBeInTheDocument();
  });

  it('pluralizes correctly across the minute boundary: 1 minute vs 2 minutes', () => {
    const { unmount } = render(
      <DeploymentTracker data={[makeDeployment({ deployedAt: secondsAgoIso(60, FIXED_NOW) })]} />
    );
    expect(screen.getByText('Deployed 1 minute ago')).toBeInTheDocument();
    unmount();

    render(
      <DeploymentTracker data={[makeDeployment({ deployedAt: secondsAgoIso(120, FIXED_NOW) })]} />
    );
    expect(screen.getByText('Deployed 2 minutes ago')).toBeInTheDocument();
  });

  it('crosses the hour boundary: 59 minutes -> minutes label, 60 minutes -> "1 hour ago"', () => {
    const { unmount } = render(
      <DeploymentTracker
        data={[makeDeployment({ deployedAt: secondsAgoIso(59 * 60, FIXED_NOW) })]}
      />
    );
    expect(screen.getByText('Deployed 59 minutes ago')).toBeInTheDocument();
    unmount();

    render(
      <DeploymentTracker
        data={[makeDeployment({ deployedAt: secondsAgoIso(TIME_UNIT_SECONDS.hour, FIXED_NOW) })]}
      />
    );
    expect(screen.getByText('Deployed 1 hour ago')).toBeInTheDocument();
  });

  it('crosses the day boundary: 23 hours -> hours label, 24 hours -> "1 day ago"', () => {
    const { unmount } = render(
      <DeploymentTracker
        data={[
          makeDeployment({ deployedAt: secondsAgoIso(23 * TIME_UNIT_SECONDS.hour, FIXED_NOW) }),
        ]}
      />
    );
    expect(screen.getByText('Deployed 23 hours ago')).toBeInTheDocument();
    unmount();

    render(
      <DeploymentTracker
        data={[makeDeployment({ deployedAt: secondsAgoIso(TIME_UNIT_SECONDS.day, FIXED_NOW) })]}
      />
    );
    expect(screen.getByText('Deployed 1 day ago')).toBeInTheDocument();
  });

  it('crosses the week boundary: 6 days -> days label, 7 days -> "1 week ago"', () => {
    const { unmount } = render(
      <DeploymentTracker
        data={[makeDeployment({ deployedAt: secondsAgoIso(6 * TIME_UNIT_SECONDS.day, FIXED_NOW) })]}
      />
    );
    expect(screen.getByText('Deployed 6 days ago')).toBeInTheDocument();
    unmount();

    render(
      <DeploymentTracker
        data={[makeDeployment({ deployedAt: secondsAgoIso(TIME_UNIT_SECONDS.week, FIXED_NOW) })]}
      />
    );
    expect(screen.getByText('Deployed 1 week ago')).toBeInTheDocument();
  });

  it('crosses the month boundary: 3 weeks -> weeks label, 30 days -> "1 month ago"', () => {
    const { unmount } = render(
      <DeploymentTracker
        data={[
          makeDeployment({ deployedAt: secondsAgoIso(3 * TIME_UNIT_SECONDS.week, FIXED_NOW) }),
        ]}
      />
    );
    expect(screen.getByText('Deployed 3 weeks ago')).toBeInTheDocument();
    unmount();

    render(
      <DeploymentTracker
        data={[makeDeployment({ deployedAt: secondsAgoIso(TIME_UNIT_SECONDS.month, FIXED_NOW) })]}
      />
    );
    expect(screen.getByText('Deployed 1 month ago')).toBeInTheDocument();
  });

  it('crosses the year boundary: 11 months -> months label, 365 days -> "1 year ago"', () => {
    const { unmount } = render(
      <DeploymentTracker
        data={[
          makeDeployment({ deployedAt: secondsAgoIso(11 * TIME_UNIT_SECONDS.month, FIXED_NOW) }),
        ]}
      />
    );
    expect(screen.getByText('Deployed 11 months ago')).toBeInTheDocument();
    unmount();

    render(
      <DeploymentTracker
        data={[makeDeployment({ deployedAt: secondsAgoIso(TIME_UNIT_SECONDS.year, FIXED_NOW) })]}
      />
    );
    expect(screen.getByText('Deployed 1 year ago')).toBeInTheDocument();
  });

  it("produces the identical label for the same UTC instant regardless of the ISO string's own offset notation", () => {
    // Same absolute instant, expressed with a +00:00, a +05:30, and a Z suffix.
    const instantUtc = new Date(FIXED_NOW.getTime() - 2 * TIME_UNIT_SECONDS.hour * 1000);
    const isoZ = instantUtc.toISOString(); // e.g. 2026-06-17T10:00:00.000Z
    const isoWithIstOffset = isoZ
      .replace('Z', '+05:30')
      .replace(
        /T(\d{2}):(\d{2})/,
        (_, h, m) =>
          `T${String((parseInt(h, 10) + 5) % 24).padStart(2, '0')}:${String((parseInt(m, 10) + 30) % 60).padStart(2, '0')}`
      );

    const { unmount } = render(<DeploymentTracker data={[makeDeployment({ deployedAt: isoZ })]} />);
    expect(screen.getByText('Deployed 2 hours ago')).toBeInTheDocument();
    unmount();

    render(<DeploymentTracker data={[makeDeployment({ deployedAt: isoWithIstOffset })]} />);
    expect(screen.getByText('Deployed 2 hours ago')).toBeInTheDocument();
  });

  it('renders the same relative label when the host TZ environment variable differs (no local-time leakage)', () => {
    const originalTz = process.env.TZ;
    const deployedAt = secondsAgoIso(3 * TIME_UNIT_SECONDS.hour, FIXED_NOW);

    process.env.TZ = 'Pacific/Kiritimati'; // UTC+14
    const { unmount } = render(<DeploymentTracker data={[makeDeployment({ deployedAt })]} />);
    expect(screen.getByText('Deployed 3 hours ago')).toBeInTheDocument();
    unmount();

    process.env.TZ = 'Etc/GMT+12'; // UTC-12
    render(<DeploymentTracker data={[makeDeployment({ deployedAt })]} />);
    expect(screen.getByText('Deployed 3 hours ago')).toBeInTheDocument();

    process.env.TZ = originalTz;
  });

  it('handles a deployedAt timestamp that straddles a DST transition correctly (instant math, not wall-clock math)', () => {
    // US DST spring-forward 2026: Mar 8, 2:00 AM local -> 3:00 AM local.
    // Pin "now" to just after the transition and check a deployment from
    // exactly 2 hours prior, in absolute terms.
    vi.setSystemTime(new Date('2026-03-08T10:00:00.000Z'));
    const deployedAt = new Date('2026-03-08T08:00:00.000Z').toISOString();
    render(<DeploymentTracker data={[makeDeployment({ deployedAt })]} />);
    expect(screen.getByText('Deployed 2 hours ago')).toBeInTheDocument();
  });
});
