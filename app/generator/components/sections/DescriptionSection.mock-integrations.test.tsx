import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React, { useState, useEffect } from 'react';
import { DescriptionSection } from './DescriptionSection';

// ----------------------------------------------------------------------
// Mock Database & Cache Layer
// ----------------------------------------------------------------------
const mockDatabaseFetch = vi.fn();
const mockDatabaseWrite = vi.fn();
const mockLocalCacheRead = vi.fn();
const mockLocalCacheWrite = vi.fn();

function MockServiceWrapper({ forceTimeout = false }: { forceTimeout?: boolean }) {
  const [description, setDescription] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [timeoutError, setTimeoutError] = useState<boolean>(false);

  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      // 3. Query local cache layer first
      const cachedData = mockLocalCacheRead();
      if (cachedData) {
        if (!isCancelled) {
          setDescription(cachedData);
          setLoading(false);
        }
        return;
      }

      try {
        // Mock standard async network delay
        await new Promise((resolve, reject) => {
          setTimeout(() => {
            if (forceTimeout) reject(new Error('Endpoint Timeout'));
            else resolve('Fetched Bio from DB');
          }, 50);
        });

        const dbData = mockDatabaseFetch();
        if (!isCancelled) {
          setDescription(dbData);
          setLoading(false);
        }
      } catch (err) {
        if (!isCancelled) {
          setTimeoutError(true);
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [forceTimeout]);

  const handleSave = async (newValue: string) => {
    setDescription(newValue);
    // 5. Assert complete cache sync is written on success callbacks
    mockDatabaseWrite(newValue);
    mockLocalCacheWrite(newValue);
  };

  if (loading) return <div data-testid="pending-state-overlay">Loading Service...</div>;
  if (timeoutError) return <div data-testid="fallback-ui">Service Timeout Fallback</div>;

  return <DescriptionSection value={description} onChange={handleSave} />;
}

// ----------------------------------------------------------------------
// Test Suite
// ----------------------------------------------------------------------
describe('Asynchronous Service Layer Mocking & Local Cache Stubs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Mock standard asynchronous imports and databases using stubs', async () => {
    mockLocalCacheRead.mockReturnValue(null);
    mockDatabaseFetch.mockReturnValue('Mocked Database Bio');

    render(<MockServiceWrapper />);

    await waitFor(() => {
      expect(mockDatabaseFetch).toHaveBeenCalled();
      expect(screen.getByDisplayValue('Mocked Database Bio')).toBeTruthy();
    });
  });

  it('2. Test service loading paths to ensure pending state overlays render', () => {
    mockLocalCacheRead.mockReturnValue(null);
    render(<MockServiceWrapper />);

    // Assert that the overlay renders immediately before async promises resolve
    expect(screen.getByTestId('pending-state-overlay')).toBeTruthy();
  });

  it('3. Assert local cache layers are queried before triggering database retrievals', async () => {
    mockLocalCacheRead.mockReturnValue('Cached Local Bio');

    render(<MockServiceWrapper />);

    await waitFor(() => {
      expect(mockLocalCacheRead).toHaveBeenCalledTimes(1);
      // DB fetch should NOT be called if cache hits
      expect(mockDatabaseFetch).not.toHaveBeenCalled();
      expect(screen.getByDisplayValue('Cached Local Bio')).toBeTruthy();
    });
  });

  it('4. Verify correct fallback procedures during fake endpoint timeout blocks', async () => {
    mockLocalCacheRead.mockReturnValue(null);

    render(<MockServiceWrapper forceTimeout={true} />);

    await waitFor(() => {
      // Verifies the timeout triggers the fallback block safely
      expect(screen.getByTestId('fallback-ui')).toBeTruthy();
      expect(screen.queryByTestId('pending-state-overlay')).toBeNull();
    });
  });

  it('5. Assert complete cache sync is written on success callbacks', async () => {
    mockLocalCacheRead.mockReturnValue('Cached Bio');
    render(<MockServiceWrapper />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Cached Bio')).toBeTruthy();
    });

    const textarea = screen.getByRole('textbox');

    // Simulate user editing the bio to trigger the save callback
    fireEvent.change(textarea, { target: { value: 'Updated Bio Content' } });

    // We check if the DB and Cache Write stubs were successfully synced with the new data
    expect(mockDatabaseWrite).toHaveBeenCalledWith('Updated Bio Content');
    expect(mockLocalCacheWrite).toHaveBeenCalledWith('Updated Bio Content');
  });
});
