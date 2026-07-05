import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Highlights from './Highlights';
import type { PRInsightData } from '@/services/github/pr-insights';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    a: ({
      children,
      className,
      href,
      target,
      rel,
    }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { children: React.ReactNode }) => (
      <a className={className} href={href} target={target} rel={rel}>
        {children}
      </a>
    ),
  },
}));

// Mock TranslationContext
vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'dashboard.prInsights.fastest_merged': 'Fastest Merged',
        'dashboard.prInsights.most_discussed': 'Most Discussed',
        'dashboard.prInsights.largest_pr': 'Largest PR',
        'dashboard.prInsights.hrs': 'hrs',
        'dashboard.prInsights.comments': 'comments',
        'dashboard.prInsights.no_highlights': 'No highlights available',
      };
      return translations[key] || key;
    },
  }),
}));

const mockHighlights: PRInsightData['highlights'] = {
  fastestMerged: {
    title: 'Fix UTC offset bug',
    time: 2.5,
    url: 'https://github.com/test/pr/1',
  },
  mostDiscussed: {
    title: 'Add IST timezone support',
    comments: 42,
    url: 'https://github.com/test/pr/2',
  },
  largest: {
    title: 'Refactor calendar boundary logic',
    additions: 300,
    deletions: 150,
    url: 'https://github.com/test/pr/3',
  },
};

describe('Highlights - timezone boundaries', () => {
  beforeEach(() => {
    // Simulate UTC timezone environment
    vi.stubGlobal('Intl', {
      ...Intl,
      DateTimeFormat: vi.fn().mockImplementation(() => ({
        resolvedOptions: () => ({ timeZone: 'UTC' }),
        format: (date: Date) => date.toISOString().split('T')[0],
      })),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders all three highlight cards with correct values in UTC timezone', () => {
    render(<Highlights highlights={mockHighlights} />);

    expect(screen.getByText('Fastest Merged')).toBeInTheDocument();
    expect(screen.getByText('Most Discussed')).toBeInTheDocument();
    expect(screen.getByText('Largest PR')).toBeInTheDocument();
    expect(screen.getByText('2.5 hrs')).toBeInTheDocument();
    expect(screen.getByText('42 comments')).toBeInTheDocument();
    expect(screen.getByText('+300 -150')).toBeInTheDocument();
  });

  it('displays N/A and no-highlights message when all highlight data is null across timezones', () => {
    const emptyHighlights: PRInsightData['highlights'] = {
      fastestMerged: undefined,
      mostDiscussed: undefined,
      largest: undefined,
    };

    render(<Highlights highlights={emptyHighlights} />);

    const naValues = screen.getAllByText('N/A');
    expect(naValues).toHaveLength(3);

    const noHighlights = screen.getAllByText('No highlights available');
    expect(noHighlights).toHaveLength(3);
  });

  it('correctly formats decimal time values across locale boundaries', () => {
    const highlights: PRInsightData['highlights'] = {
      ...mockHighlights,
      fastestMerged: {
        title: 'DST transition PR',
        time: 23.999,
        url: 'https://github.com/test/pr/4',
      },
    };

    render(<Highlights highlights={highlights} />);

    // toFixed(1) should normalize 23.999 to 24.0 across all locales
    expect(screen.getByText('24.0 hrs')).toBeInTheDocument();
  });

  it('renders PR links with correct href across different timezone contexts', () => {
    render(<Highlights highlights={mockHighlights} />);

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(3);

    expect(links[0]).toHaveAttribute('href', 'https://github.com/test/pr/1');
    expect(links[1]).toHaveAttribute('href', 'https://github.com/test/pr/2');
    expect(links[2]).toHaveAttribute('href', 'https://github.com/test/pr/3');

    // All links open in new tab - safe across all timezone/locale environments
    links.forEach((link) => {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  it('handles leap year boundary date in PR title without rendering errors', () => {
    const leapYearHighlights: PRInsightData['highlights'] = {
      ...mockHighlights,
      fastestMerged: {
        title: 'Fix Feb 29 2024 leap year calendar boundary',
        time: 1.0,
        url: 'https://github.com/test/pr/5',
      },
    };

    render(<Highlights highlights={leapYearHighlights} />);

    expect(screen.getByText('Fix Feb 29 2024 leap year calendar boundary')).toBeInTheDocument();
    expect(screen.getByText('1.0 hrs')).toBeInTheDocument();
  });
});
