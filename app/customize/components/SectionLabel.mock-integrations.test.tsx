import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { SectionLabel } from './SectionLabel';

// --- 1. Mocking Asynchronous Service Layer & Cache Stubs ---
const mockFetchDataFromDB = vi.fn();
const mockLocalCache = {
  get: vi.fn(),
  set: vi.fn(),
};

// Simulated controller hook that mimics the container pattern safely
function useSectionController(sectionId: string) {
  // Initialize state directly from the cache to avoid synchronous setState inside useEffect
  const [data, setData] = React.useState<{ label: string } | null>(() => {
    return mockLocalCache.get(sectionId) || null;
  });

  // If we already have data from the cache on mount, we aren't loading
  const [loading, setLoading] = React.useState(() => !mockLocalCache.get(sectionId));
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    // If cache already hit during initialization, skip making database fetches
    if (data) return;

    mockFetchDataFromDB(sectionId)
      .then((res: { label: string }) => {
        mockLocalCache.set(sectionId, res);
        setData(res);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, [sectionId, data]);

  return { data, loading, error };
}

function ConnectedSectionLabel({ sectionId }: { sectionId: string }) {
  const { data, loading, error } = useSectionController(sectionId);

  if (loading) return <div data-testid="loading-overlay">Loading...</div>;
  if (error) return <SectionLabel>Fallback Label</SectionLabel>;
  return <SectionLabel>{data?.label}</SectionLabel>;
}

describe('SectionLabel - Asynchronous Service Layer Mocking & Local Cache Stubs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test Case 1: Pending State Overlay Render
  it('should render the pending state overlay while the service layer is loading', () => {
    mockLocalCache.get.mockReturnValue(null);
    mockFetchDataFromDB.mockReturnValue(new Promise(() => {})); // Never resolves

    render(<ConnectedSectionLabel sectionId="home-section" />);

    expect(screen.getByTestId('loading-overlay')).toBeInTheDocument();
  });

  // Test Case 2: Cache-First Querying
  it('should query the local cache layer before triggering database retrievals', async () => {
    mockLocalCache.get.mockReturnValue({ label: 'Cached Content' });

    render(<ConnectedSectionLabel sectionId="home-section" />);

    expect(mockLocalCache.get).toHaveBeenCalledWith('home-section');
    expect(mockFetchDataFromDB).not.toHaveBeenCalled();
    expect(await screen.findByText('Cached Content')).toBeInTheDocument();
  });

  // Test Case 3: Complete Cache Sync on Success
  it('should write to the cache sync layer on successful database callbacks', async () => {
    mockLocalCache.get.mockReturnValue(null);
    const mockData = { label: 'Fresh DB Content' };
    mockFetchDataFromDB.mockResolvedValue(mockData);

    render(<ConnectedSectionLabel sectionId="home-section" />);

    expect(await screen.findByText('Fresh DB Content')).toBeInTheDocument();
    expect(mockLocalCache.set).toHaveBeenCalledWith('home-section', mockData);
  });

  // Test Case 4: Fallback Procedures on Timeout Block
  it('should verify correct fallback procedures during fake endpoint timeout blocks', async () => {
    mockLocalCache.get.mockReturnValue(null);
    mockFetchDataFromDB.mockRejectedValue(new Error('Timeout Failure'));

    render(<ConnectedSectionLabel sectionId="home-section" />);

    expect(await screen.findByText('Fallback Label')).toBeInTheDocument();
    expect(screen.queryByTestId('loading-overlay')).not.toBeInTheDocument();
  });

  // Test Case 5: Standard Mount & Uncached Execution Path
  it('should invoke database fetch on cache miss and successfully project text onto SectionLabel', async () => {
    mockLocalCache.get.mockReturnValue(null);
    mockFetchDataFromDB.mockResolvedValue({ label: 'Async UI Label' });

    render(<ConnectedSectionLabel sectionId="home-section" />);

    expect(await screen.findByText('Async UI Label')).toBeInTheDocument();
    expect(mockFetchDataFromDB).toHaveBeenCalledTimes(1);
  });
});
