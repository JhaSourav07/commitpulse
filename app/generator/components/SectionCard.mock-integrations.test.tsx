import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import React, { useState } from 'react';
import { SectionCard } from './SectionCard';

// --- MOCK SERVICE LAYER & CACHE STUBS ---
const mockApiService = {
  fetchDatabaseData: vi.fn(),
};

const mockCacheService = {
  get: vi.fn(),
  set: vi.fn(),
};

// --- WRAPPER COMPONENT TO EMULATE DATA FETCHING INTEGRATION ---
function SectionCardIntegrationWrapper() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Assert local cache layers are queried before database retrievals
      const cachedData = mockCacheService.get('section-key');
      if (cachedData) {
        setData(cachedData);
        setLoading(false);
        return;
      }

      // 2. Database Retrieval on cache miss
      const result = await mockApiService.fetchDatabaseData();
      setData(result);

      // 3. Complete cache sync written on success callbacks
      mockCacheService.set('section-key', result);
    } catch (err: unknown) {
      // 4. Fallback procedures during fake endpoint timeout/errors (Type-safe handling)
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Timeout/Fetch failure error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard title="Integration Card" description="Async testing container">
      <button data-testid="fetch-trigger" onClick={loadData}>
        Fetch Content
      </button>
      {loading && <div data-testid="pending-overlay">Loading service data...</div>}
      {error && <div data-testid="error-fallback">{error}</div>}
      {data && <div data-testid="data-content">{data}</div>}
    </SectionCard>
  );
}

describe('SectionCard Asynchronous Service Layer & Local Cache Stubs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test Case 1: Service Loading Paths & Pending Overlay
  it('renders pending state overlay when service loading paths are active', async () => {
    mockCacheService.get.mockReturnValue(null);
    // Return a delayed promise that doesn't resolve immediately
    mockApiService.fetchDatabaseData.mockReturnValue(
      new Promise((resolve) => setTimeout(() => resolve('Fresh Data'), 100))
    );

    render(<SectionCardIntegrationWrapper />);

    const trigger = screen.getByTestId('fetch-trigger');
    fireEvent.click(trigger);

    expect(screen.getByTestId('pending-overlay')).toBeInTheDocument();
    expect(screen.getByTestId('pending-overlay')).toHaveTextContent('Loading service data...');
  });

  // Test Case 2: Local Cache Layer is Queried First
  it('asserts that local cache layers are queried first before database retrievals', async () => {
    mockCacheService.get.mockReturnValue('Cached Content Stubs');

    render(<SectionCardIntegrationWrapper />);

    const trigger = screen.getByTestId('fetch-trigger');
    fireEvent.click(trigger);

    expect(mockCacheService.get).toHaveBeenCalledWith('section-key');
    expect(screen.getByTestId('data-content')).toHaveTextContent('Cached Content Stubs');
    // Ensure database retrieval wasn't triggered because cache was a hit
    expect(mockApiService.fetchDatabaseData).not.toHaveBeenCalled();
  });

  // Test Case 3: Database Retrieval on Cache Miss
  it('triggers service layer database retrieval on local cache miss', async () => {
    mockCacheService.get.mockReturnValue(null); // Cache miss
    mockApiService.fetchDatabaseData.mockResolvedValue('Fresh Database Value');

    render(<SectionCardIntegrationWrapper />);

    const trigger = screen.getByTestId('fetch-trigger');
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(mockApiService.fetchDatabaseData).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('data-content')).toHaveTextContent('Fresh Database Value');
    });
  });

  // Test Case 4: Fallback Procedures During Endpoint Timeout
  it('verifies correct fallback procedures trigger during fake endpoint timeout blocks', async () => {
    mockCacheService.get.mockReturnValue(null);
    // Simulate an endpoint timeout rejecting response
    mockApiService.fetchDatabaseData.mockRejectedValue(new Error('Gateway Timeout (504)'));

    render(<SectionCardIntegrationWrapper />);

    const trigger = screen.getByTestId('fetch-trigger');
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByTestId('error-fallback')).toBeInTheDocument();
      expect(screen.getByTestId('error-fallback')).toHaveTextContent('Gateway Timeout (504)');
    });
  });

  // Test Case 5: Cache Sync Written on Success Callbacks
  it('asserts complete cache sync is written on successful database retrieval callbacks', async () => {
    mockCacheService.get.mockReturnValue(null);
    mockApiService.fetchDatabaseData.mockResolvedValue('Payload Update Sync');

    render(<SectionCardIntegrationWrapper />);

    const trigger = screen.getByTestId('fetch-trigger');
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(mockCacheService.set).toHaveBeenCalledWith('section-key', 'Payload Update Sync');
    });
  });
});
