import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BurnoutAnalyzerPage from './page';

let mockOwnerParam: string | null = null;
let mockRepoParam: string | null = null;
const mockHistoryBack = vi.fn();
const mockRouterPush = vi.fn();

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: (key: string) => {
      if (key === 'owner') return mockOwnerParam;
      if (key === 'repo') return mockRepoParam;
      return null;
    },
  }),
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...(actual as object),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

describe('BurnoutAnalyzerPage repository input handling', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    mockHistoryBack.mockReset();
    mockRouterPush.mockReset();
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

  it('goes back to the previous page when browser history exists', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        repoName: 'facebook/react',
        totalCommits: 1,
        totalContributors: 1,
        busFactor: 1,
        dependencyRisk: 'Low',
        sustainabilityScore: 96,
        contributors: [],
        inactivityAlerts: [],
        recommendations: [],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(window.history, 'length', 'get').mockReturnValue(2);
    vi.spyOn(window.history, 'back').mockImplementation(mockHistoryBack);
    vi.spyOn(window.history, 'pushState').mockImplementation(vi.fn());
    vi.spyOn(document, 'referrer', 'get').mockReturnValue('http://localhost/burnout-analyzer');

    render(<BurnoutAnalyzerPage />);
    fireEvent.change(screen.getByPlaceholderText(/facebook\/react/i), {
      target: { value: 'facebook/react' },
    });
    fireEvent.click(screen.getByRole('button', { name: /analyze/i }));

    await screen.findByText(/Owned by/i);
    const backButton = screen.getByRole('button', { name: /back to search/i });
    fireEvent.click(backButton);

    expect(mockHistoryBack).toHaveBeenCalledTimes(1);
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it('redirects to the burnout analyzer search page when there is no browser history', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        repoName: 'vercel/next.js',
        totalCommits: 1,
        totalContributors: 1,
        busFactor: 1,
        dependencyRisk: 'Low',
        sustainabilityScore: 94,
        contributors: [],
        inactivityAlerts: [],
        recommendations: [],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(window.history, 'length', 'get').mockReturnValue(1);
    vi.spyOn(window.history, 'back').mockImplementation(mockHistoryBack);
    vi.spyOn(window.history, 'pushState').mockImplementation(vi.fn());
    vi.spyOn(document, 'referrer', 'get').mockReturnValue('http://localhost/another-page');

    render(<BurnoutAnalyzerPage />);
    fireEvent.change(screen.getByPlaceholderText(/facebook\/react/i), {
      target: { value: 'vercel/next.js' },
    });
    fireEvent.click(screen.getByRole('button', { name: /analyze/i }));

    await screen.findByText(/Owned by/i);
    const backButton = screen.getByRole('button', { name: /back to search/i });
    fireEvent.click(backButton);

    expect(mockRouterPush).toHaveBeenCalledWith('/burnout-analyzer');
    expect(mockHistoryBack).not.toHaveBeenCalled();
  });
});
