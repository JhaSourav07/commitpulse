import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Footer } from './Footer';
import { useTranslation } from '@/context/TranslationContext';
import '@testing-library/jest-dom';

vi.mock('@/context/TranslationContext', () => ({
  useTranslation: vi.fn(),
}));

const mockT = vi.fn((path: string, params?: Record<string, string>) => {
  if (path === 'footer.copyright') return `© ${params?.year} CommitPulse. All rights reserved.`;
  return path === 'footer.made_with' ? 'Made with ❤️ for developers' : path;
});

const originalTZ = process.env.TZ;

function setSystemTime(isoUtc: string, timezone: string) {
  process.env.TZ = timezone;
  vi.setSystemTime(new Date(isoUtc));
}

describe('Footer Timezone Boundaries (copyright year)', () => {
  beforeEach(() => {
    vi.mocked(useTranslation).mockReturnValue({
      language: 'en',
      changeLanguage: vi.fn(),
      t: mockT,
      isPending: false,
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    process.env.TZ = originalTZ;
  });

  it.each([
    { label: 'UTC', tz: 'UTC', iso: '2026-06-15T12:00:00Z', expectedYear: 2026 },
    {
      label: 'EST year boundary',
      tz: 'America/New_York',
      iso: '2026-01-01T02:00:00Z',
      expectedYear: 2025,
    },
    {
      label: 'IST year boundary',
      tz: 'Asia/Kolkata',
      iso: '2025-12-31T20:00:00Z',
      expectedYear: 2026,
    },
    {
      label: 'JST year boundary',
      tz: 'Asia/Tokyo',
      iso: '2025-12-31T16:00:00Z',
      expectedYear: 2026,
    },
  ])('computes the copyright year correctly in $label', ({ tz, iso, expectedYear }) => {
    setSystemTime(iso, tz);
    render(<Footer />);
    expect(
      screen.getByText(`© ${expectedYear} CommitPulse. All rights reserved.`)
    ).toBeInTheDocument();
  });

  it('computes the copyright year correctly on a leap day and across a DST transition instant', () => {
    setSystemTime('2028-02-29T12:00:00Z', 'UTC');
    const { unmount: unmount1 } = render(<Footer />);
    expect(screen.getByText('© 2028 CommitPulse. All rights reserved.')).toBeInTheDocument();
    unmount1();

    setSystemTime('2026-03-08T07:00:00Z', 'America/New_York');
    render(<Footer />);
    expect(screen.getByText('© 2026 CommitPulse. All rights reserved.')).toBeInTheDocument();
  });
});
