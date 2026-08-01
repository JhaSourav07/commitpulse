import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BurnoutAnalyzerPage from './page';

let mockOwnerParam: string | null = null;
let mockRepoParam: string | null = null;

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: (key: string) => {
      if (key === 'owner') return mockOwnerParam;
      if (key === 'repo') return mockRepoParam;
      return null;
    },
  }),
}));

describe('BurnoutAnalyzerPage repository input handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOwnerParam = null;
    mockRepoParam = null;
  });

  it('rejects a path that is not exactly owner/repo and does not call the API', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    render(<BurnoutAnalyzerPage />);
    fireEvent.change(screen.getByPlaceholderText(/facebook\/react/i), {
      target: { value: 'facebook/react/tree/main' },
    });
    fireEvent.click(screen.getByRole('button', { name: /analyze/i }));

    expect(await screen.findByText(/valid repository path/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('URL-encodes owner and repo so the typed input is what gets validated, not a different repo', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Invalid repo name format' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<BurnoutAnalyzerPage />);
    fireEvent.change(screen.getByPlaceholderText(/facebook\/react/i), {
      target: { value: 'foo/bar&x=1' },
    });
    fireEvent.click(screen.getByRole('button', { name: /analyze/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const calledUrl = fetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain(`repo=${encodeURIComponent('bar&x=1')}`);
    expect(calledUrl).not.toContain('repo=bar&x=1');
  });

  it('sends a correctly encoded request for a valid owner/repo', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'stop here' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<BurnoutAnalyzerPage />);
    fireEvent.change(screen.getByPlaceholderText(/facebook\/react/i), {
      target: { value: 'facebook/react' },
    });
    fireEvent.click(screen.getByRole('button', { name: /analyze/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock.mock.calls[0][0]).toBe(
      '/api/repo-burnout?owner=facebook&repo=react&excludeBots=false'
    );
  });

  it('automatically triggers search on load if owner and repo URL parameters are present', async () => {
    mockOwnerParam = 'vercel';
    mockRepoParam = 'next.js';

    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'stop here' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<BurnoutAnalyzerPage />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock.mock.calls[0][0]).toBe(
      '/api/repo-burnout?owner=vercel&repo=next.js&excludeBots=false'
    );
  });
});
