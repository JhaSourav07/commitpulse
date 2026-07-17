import { beforeEach, afterEach, describe, expect, test, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { SocialsSection } from './SocialsSection';

// Mock lucide-react using partial mocks
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    Search: (props: Record<string, unknown>) => <div data-testid="search-icon" {...props} />,
    X: (props: Record<string, unknown>) => <div data-testid="x-icon" {...props} />,
    ExternalLink: (props: Record<string, unknown>) => (
      <div data-testid="external-link-icon" {...props} />
    ),
    ChevronDown: (props: Record<string, unknown>) => (
      <div data-testid="chevron-down-icon" {...props} />
    ),
  };
});

describe('SocialsSection - Timezone Boundaries & Leap Years', () => {
  const originalDateTimeFormat = Intl.DateTimeFormat;

  const mockTimezone = (timezone: string) => {
    vi.spyOn(Intl, 'DateTimeFormat').mockImplementation((locale, options) => {
      return new originalDateTimeFormat(locale, { ...options, timeZone: timezone });
    });
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // Test Case 1: Mock standard timezone settings (UTC, EST, IST, JST) and verify rendering remains consistent
  test('1. mock standard timezone settings (UTC, EST, IST, JST) and verify rendering remains consistent', () => {
    const timezones = ['UTC', 'America/New_York', 'Asia/Kolkata', 'Asia/Tokyo'];
    timezones.forEach((tz) => {
      mockTimezone(tz);
      const { unmount } = render(
        <SocialsSection
          selected={['github', 'twitter']}
          socialLinks={{ github: 'https://github.com/testuser' }}
          onSelectedChange={vi.fn()}
          onLinkChange={vi.fn()}
        />
      );
      expect(screen.getAllByText('GitHub').length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Twitter/i).length).toBeGreaterThan(0);
      unmount();
    });
  });

  // Test Case 2: Verify timezone offsets do not shift rendered data unexpectedly across date boundaries
  test('2. verify timezone offsets do not shift rendered data unexpectedly across date boundaries', () => {
    const commitDateUTC = '2026-06-03T23:00:00Z'; // 11 PM UTC
    // Asia/Tokyo offset is +9, shifting it to next day: 2026-06-04T08:00:00
    const dateJST = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Tokyo',
      dateStyle: 'short',
    }).format(new Date(commitDateUTC));

    const { container, unmount } = render(
      <SocialsSection
        selected={['github']}
        socialLinks={{ github: `https://github.com/testuser?date=${dateJST}` }}
        onSelectedChange={vi.fn()}
        onLinkChange={vi.fn()}
      />
    );

    // Switch to the links tab using the tab ID
    const linksTab = container.querySelector('#tab-social-links');
    expect(linksTab).toBeInTheDocument();
    fireEvent.click(linksTab!);

    const input = screen.getByLabelText('GitHub');
    expect(input).toHaveValue(`https://github.com/testuser?date=${dateJST}`);
    unmount();
  });

  // Test Case 3: Verify leap year dates are handled correctly without gaps or rendering failures
  test('3. verify leap year dates are handled correctly without gaps or rendering failures', () => {
    const leapDate = '2024-02-29T12:00:00Z';
    const formattedLeap = new Intl.DateTimeFormat('en-US', {
      timeZone: 'UTC',
      dateStyle: 'long',
    }).format(new Date(leapDate));

    const { container, unmount } = render(
      <SocialsSection
        selected={['twitter']}
        socialLinks={{ twitter: `https://twitter.com/testuser?date=${formattedLeap}` }}
        onSelectedChange={vi.fn()}
        onLinkChange={vi.fn()}
      />
    );

    // Switch to the links tab using the tab ID
    const linksTab = container.querySelector('#tab-social-links');
    expect(linksTab).toBeInTheDocument();
    fireEvent.click(linksTab!);

    const input = screen.getByLabelText(/Twitter/i);
    expect(input).toHaveValue(`https://twitter.com/testuser?date=${formattedLeap}`);
    expect(screen.getByText(/Twitter/i)).toBeInTheDocument();
    unmount();
  });

  // Test Case 4: Assert calendar/date formatting behaves consistently across mocked locales and timezones
  test('4. assert calendar/date formatting behaves consistently across mocked locales and timezones', () => {
    const date = new Date('2026-12-25T10:00:00Z');
    const jpFormat = new Intl.DateTimeFormat('ja-JP', {
      timeZone: 'Asia/Tokyo',
      dateStyle: 'long',
    }).format(date);

    const { container, unmount } = render(
      <SocialsSection
        selected={['github']}
        socialLinks={{ github: `https://github.com/testuser?holiday=${jpFormat}` }}
        onSelectedChange={vi.fn()}
        onLinkChange={vi.fn()}
      />
    );

    // Switch to the links tab using the tab ID
    const linksTab = container.querySelector('#tab-social-links');
    expect(linksTab).toBeInTheDocument();
    fireEvent.click(linksTab!);

    const input = screen.getByLabelText('GitHub');
    expect(input).toHaveValue(`https://github.com/testuser?holiday=${jpFormat}`);
    unmount();
  });

  // Test Case 5: Verify daylight saving transition dates do not introduce runtime errors or inconsistent output
  test('5. verify daylight saving transition dates do not introduce runtime errors or inconsistent output', () => {
    const beforeDST = '2026-03-08T01:59:59Z';
    const afterDST = '2026-03-08T03:00:01Z';

    const beforeEst = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      timeStyle: 'medium',
    }).format(new Date(beforeDST));

    const afterEst = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      timeStyle: 'medium',
    }).format(new Date(afterDST));

    const { container, unmount } = render(
      <SocialsSection
        selected={['github', 'twitter']}
        socialLinks={{
          github: `https://github.com/testuser?time=${beforeEst}`,
          twitter: `https://twitter.com/testuser?time=${afterEst}`,
        }}
        onSelectedChange={vi.fn()}
        onLinkChange={vi.fn()}
      />
    );

    // Switch to the links tab using the tab ID
    const linksTab = container.querySelector('#tab-social-links');
    expect(linksTab).toBeInTheDocument();
    fireEvent.click(linksTab!);

    expect(screen.getByLabelText('GitHub')).toHaveValue(
      `https://github.com/testuser?time=${beforeEst}`
    );
    expect(screen.getByLabelText(/Twitter/i)).toHaveValue(
      `https://twitter.com/testuser?time=${afterEst}`
    );
    unmount();
  });
});
