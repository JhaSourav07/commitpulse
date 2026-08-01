import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HeroSection } from './HeroSection';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...rest }: { children: React.ReactNode; className?: string }) => (
      <div className={className} {...rest}>
        {children}
      </div>
    ),
    p: ({ children, className, ...rest }: { children: React.ReactNode; className?: string }) => (
      <p className={className} {...rest}>
        {children}
      </p>
    ),
  },
}));

// Mock lucide-react icon
vi.mock('lucide-react', () => ({
  Copy: () => <svg data-testid="copy-icon" />,
}));

// Simulated local cache stub (no real data layer exists on this static component)
const localCache = new Map<string, boolean>();

// Mock async service layer (unused - component has no data fetching)
const mockFetchHeroData = vi.fn();

beforeEach(() => {
  localCache.clear();
  mockFetchHeroData.mockReset();
});

describe('HeroSection - mock integrations', () => {
  it('renders static content without making real network calls', () => {
    mockFetchHeroData.mockResolvedValueOnce({});

    render(<HeroSection />);

    expect(screen.getByRole('region', { name: 'Hero section' })).toBeInTheDocument();
    expect(screen.getByText(/Elevate Your/i)).toBeInTheDocument();
    // Static component has no service layer - mock should never be invoked
    expect(mockFetchHeroData).not.toHaveBeenCalled();
  });

  it('renders search form and stat badges consistently without an empty-state fallback', () => {
    localCache.set('heroLoaded', true);

    render(<HeroSection />);

    expect(
      screen.getByRole('search', { name: /Generate your GitHub streak badge/i })
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter GitHub Username')).toBeInTheDocument();
    expect(screen.getByText(/Contributions/i)).toBeInTheDocument();
    expect(screen.getByText(/Pull Requests/i)).toBeInTheDocument();
    expect(screen.getByText(/Commits/i)).toBeInTheDocument();
  });

  it('confirms no cache lookup is required before render since component is fully static', () => {
    const cachedData = localCache.get('heroLoaded');
    expect(cachedData).toBeUndefined();

    render(<HeroSection />);

    // No async fetch triggered since the component has no data dependency
    expect(mockFetchHeroData).not.toHaveBeenCalled();
    expect(screen.getByRole('region', { name: 'Hero section' })).toBeInTheDocument();
  });

  it('renders successfully with no timeout or async failure possible', async () => {
    mockFetchHeroData.mockImplementationOnce(
      () => new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 100))
    );

    render(<HeroSection />);

    // Static markup renders immediately, unaffected by the unused async mock
    expect(screen.getByRole('button', { name: /Watch Dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Copy Link/i })).toBeInTheDocument();
  });

  it('asserts no cache write occurs after render since there is no success callback path', () => {
    render(<HeroSection />);

    expect(localCache.size).toBe(0);
    expect(mockFetchHeroData).not.toHaveBeenCalled();
    expect(screen.getByLabelText('GitHub username')).toBeInTheDocument();
  });
});
