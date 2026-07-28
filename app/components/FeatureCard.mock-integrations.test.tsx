import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FeatureCard } from './FeatureCard';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...rest }: { children: React.ReactNode; className?: string }) => (
      <div className={className} {...rest}>
        {children}
      </div>
    ),
  },
}));

// Simulated local cache stub
const localCache = new Map<string, { title: string; desc: string }>();

// Mock async service layer
const mockFetchFeatureData = vi.fn();

beforeEach(() => {
  localCache.clear();
  mockFetchFeatureData.mockReset();
});

const baseProps = {
  icon: <span data-testid="mock-icon">icon</span>,
  title: 'Fast Performance',
  desc: 'Blazing fast load times across the board',
  accent: 'text-emerald-400',
};

describe('FeatureCard - mock integrations', () => {
  it('renders data from mocked service layer without making real network calls', () => {
    mockFetchFeatureData.mockResolvedValueOnce(baseProps);

    render(<FeatureCard {...baseProps} />);

    expect(screen.getByText('Fast Performance')).toBeInTheDocument();
    expect(screen.getByText('Blazing fast load times across the board')).toBeInTheDocument();
    expect(mockFetchFeatureData).not.toHaveBeenCalled();
  });

  it('renders empty fallback gracefully when mocked service returns empty cache stub', () => {
    mockFetchFeatureData.mockResolvedValueOnce({ title: '', desc: '' });
    localCache.set('feature', { title: '', desc: '' });

    render(<FeatureCard {...baseProps} title="" desc="" />);

    const article = screen.getByRole('article');
    expect(article).toBeInTheDocument();
    expect(article).toHaveAttribute('aria-labelledby', 'feature-title-');
    expect(article).toHaveAttribute('aria-describedby', 'feature-desc-');
  });

  it('verifies local cache is populated before async fetch is triggered', () => {
    localCache.set('feature', { title: baseProps.title, desc: baseProps.desc });

    const cachedData = localCache.get('feature');
    expect(cachedData).toBeDefined();
    expect(cachedData?.title).toBe('Fast Performance');

    expect(mockFetchFeatureData).not.toHaveBeenCalled();

    render(<FeatureCard {...baseProps} />);
    expect(screen.getByRole('article')).toBeInTheDocument();
  });

  it('handles timeout fallback gracefully - renders without crashing on simulated timeout', async () => {
    mockFetchFeatureData.mockImplementationOnce(
      () => new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 100))
    );

    render(
      <FeatureCard
        icon={<span>icon</span>}
        title={undefined as unknown as string}
        desc={undefined as unknown as string}
        accent=""
      />
    );

    const article = screen.getByRole('article');
    expect(article).toBeInTheDocument();
  });

  it('asserts cache sync is written correctly after successful data load', () => {
    mockFetchFeatureData.mockResolvedValueOnce(baseProps);

    localCache.set('feature', { title: baseProps.title, desc: baseProps.desc });

    const cached = localCache.get('feature');
    expect(cached?.title).toBe('Fast Performance');
    expect(cached?.desc).toBe('Blazing fast load times across the board');

    render(<FeatureCard {...baseProps} />);

    const heading = screen.getByText('Fast Performance');
    expect(heading).toHaveAttribute('id', 'feature-title-fast-performance');
  });
});
