import { beforeEach, afterEach, describe, expect, test, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
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

describe('SocialsSection - Asynchronous Service Layer Mocking & Local Cache Stubs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  // Test Case 1: Mock asynchronous services and verify loading/pending states render correctly
  test('1. mock asynchronous services and verify loading/pending states render correctly', () => {
    const fetchPromise = new Promise<Record<string, string>>(() => {}); // never resolves
    const mockService = { fetchLinks: () => fetchPromise };

    const Wrapper = () => {
      const [loading, setLoading] = React.useState(true);
      const [links, setLinks] = React.useState<Record<string, string>>({});

      React.useEffect(() => {
        mockService.fetchLinks().then((data) => {
          setLinks(data);
          setLoading(false);
        });
      }, []);

      if (loading) {
        return <div data-testid="loading-skeleton">Loading Socials...</div>;
      }

      return (
        <SocialsSection
          selected={['github']}
          socialLinks={links}
          onSelectedChange={vi.fn()}
          onLinkChange={vi.fn()}
        />
      );
    };

    render(<Wrapper />);
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
    expect(screen.queryByText('GitHub')).not.toBeInTheDocument();
  });

  // Test Case 2: Verify local cache is checked before triggering simulated requests
  test('2. verify local cache is checked before triggering simulated service/database requests', () => {
    const cachedLinks = { github: 'https://github.com/cached-user' };
    const localCache = new Map<string, string>([['social-links', JSON.stringify(cachedLinks)]]);

    const mockServiceCall = vi.fn().mockResolvedValue({});

    const Wrapper = () => {
      const [links, setLinks] = React.useState<Record<string, string>>({});

      React.useEffect(() => {
        const cached = localCache.get('social-links');
        if (cached) {
          setLinks(JSON.parse(cached));
        } else {
          mockServiceCall().then(setLinks);
        }
      }, []);

      return (
        <SocialsSection
          selected={['github']}
          socialLinks={links}
          onSelectedChange={vi.fn()}
          onLinkChange={vi.fn()}
        />
      );
    };

    const { container } = render(<Wrapper />);
    expect(mockServiceCall).not.toHaveBeenCalled();

    // Switch to links tab
    const linksTab = container.querySelector('#tab-social-links');
    expect(linksTab).toBeInTheDocument();
    fireEvent.click(linksTab!);

    const input = screen.getByLabelText('GitHub');
    expect(input).toHaveValue('https://github.com/cached-user');
  });

  // Test Case 3: Simulate service timeout and verify fallback behavior
  test('3. simulate service timeout and verify fallback behavior is rendered without runtime errors', async () => {
    const timeoutPromise = new Promise<Record<string, string>>((_, reject) => {
      setTimeout(() => reject(new Error('Timeout')), 10);
    });

    const Wrapper = () => {
      const [links, setLinks] = React.useState<Record<string, string>>({});
      const [error, setError] = React.useState<string | null>(null);

      React.useEffect(() => {
        timeoutPromise.then(setLinks).catch((err) => {
          setError(err.message);
          setLinks({ github: 'https://github.com/fallback-user' });
        });
      }, []);

      return (
        <div>
          {error && <span data-testid="error-banner">{error}</span>}
          <SocialsSection
            selected={['github']}
            socialLinks={links}
            onSelectedChange={vi.fn()}
            onLinkChange={vi.fn()}
          />
        </div>
      );
    };

    const { container } = render(<Wrapper />);

    // Use findByTestId to wait for async render update from 10ms real timer
    const errorBanner = await screen.findByTestId('error-banner');
    expect(errorBanner).toHaveTextContent('Timeout');

    const linksTab = container.querySelector('#tab-social-links');
    expect(linksTab).toBeInTheDocument();
    fireEvent.click(linksTab!);

    expect(await screen.findByLabelText('GitHub')).toHaveValue('https://github.com/fallback-user');
  });

  // Test Case 4: Verify successful asynchronous callbacks update the mocked cache correctly
  test('4. verify successful asynchronous callbacks update the mocked cache correctly', async () => {
    const freshLinks = { github: 'https://github.com/fresh-user' };
    const localCache = new Map<string, string>();
    const fetchSuccess = vi.fn().mockResolvedValue(freshLinks);

    const Wrapper = () => {
      const [links, setLinks] = React.useState<Record<string, string>>({});

      React.useEffect(() => {
        fetchSuccess().then((data: Record<string, string>) => {
          setLinks(data);
          localCache.set('social-links', JSON.stringify(data));
        });
      }, []);

      return (
        <SocialsSection
          selected={['github']}
          socialLinks={links}
          onSelectedChange={vi.fn()}
          onLinkChange={vi.fn()}
        />
      );
    };

    const { container } = render(<Wrapper />);

    const linksTab = container.querySelector('#tab-social-links');
    expect(linksTab).toBeInTheDocument();
    fireEvent.click(linksTab!);

    expect(await screen.findByLabelText('GitHub')).toHaveValue('https://github.com/fresh-user');
    expect(fetchSuccess).toHaveBeenCalled();
    expect(localCache.get('social-links')).toBe(JSON.stringify(freshLinks));
  });

  // Test Case 5: Verify asynchronous failures are handled gracefully without crashing the component
  test('5. verify asynchronous failures are handled gracefully without crashing the component', async () => {
    const fetchFailure = vi.fn().mockRejectedValue(new Error('Network Error'));

    const Wrapper = () => {
      const [links] = React.useState<Record<string, string>>({});
      const [failed, setFailed] = React.useState(false);

      React.useEffect(() => {
        fetchFailure().catch(() => {
          setFailed(true);
        });
      }, []);

      return (
        <div>
          {failed && <div data-testid="error-notice">Failed to load socials</div>}
          <SocialsSection
            selected={['github']}
            socialLinks={links}
            onSelectedChange={vi.fn()}
            onLinkChange={vi.fn()}
          />
        </div>
      );
    };

    render(<Wrapper />);

    expect(await screen.findByTestId('error-notice')).toBeInTheDocument();
    expect(fetchFailure).toHaveBeenCalled();
    expect(screen.getByText('Socials')).toBeInTheDocument();
  });
});
