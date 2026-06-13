import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

type ContributorsClientProps = {
  contributors: unknown[];
  totalContributions: number;
  topContributors: unknown[];
};

const mockContributorsClient = vi.fn((props: ContributorsClientProps) => {
  void props;

  return <div data-testid="contributors-client">Contributors Client</div>;
});

vi.mock('./ContributorsClient', () => ({
  default: (props: ContributorsClientProps) => mockContributorsClient(props),
}));

describe('ContributorsPage Error Resilience', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders successfully under normal conditions', async () => {
    const { default: ContributorsPage } = await import('./page');

    const page = await ContributorsPage();

    render(page);

    expect(screen.getByTestId('contributors-client')).toBeInTheDocument();
  });

  it('handles failed contributor fetches without crashing', async () => {
    const originalFetch = global.fetch;

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      headers: {
        get: () => null,
      },
    } as unknown as Response);

    const { default: ContributorsPage } = await import('./page');

    const page = await ContributorsPage();

    render(page);

    expect(screen.getByTestId('contributors-client')).toBeInTheDocument();

    global.fetch = originalFetch;
  });

  it('handles rate limit responses gracefully', async () => {
    const originalFetch = global.fetch;

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      headers: {
        get: (name: string) => (name === 'x-ratelimit-remaining' ? '0' : null),
      },
    } as unknown as Response);

    const { default: ContributorsPage } = await import('./page');

    const page = await ContributorsPage();

    render(page);

    expect(screen.getByTestId('contributors-client')).toBeInTheDocument();

    global.fetch = originalFetch;
  });

  it('passes empty contributor collections after fetch failures', async () => {
    const originalFetch = global.fetch;

    global.fetch = vi.fn().mockRejectedValue(new Error('Database unavailable'));

    const { default: ContributorsPage } = await import('./page');

    const page = await ContributorsPage();

    render(page);

    expect(mockContributorsClient).toHaveBeenCalled();

    const props = mockContributorsClient.mock.calls[0][0] as ContributorsClientProps;

    expect(props.contributors).toEqual([]);
    expect(props.topContributors).toEqual([]);

    global.fetch = originalFetch;
  });

  it('continues rendering when unexpected service exceptions occur', async () => {
    const originalFetch = global.fetch;

    global.fetch = vi.fn().mockRejectedValue(new Error('Unexpected runtime error'));

    const { default: ContributorsPage } = await import('./page');

    const page = await ContributorsPage();

    render(page);

    expect(screen.getByTestId('contributors-client')).toBeInTheDocument();

    global.fetch = originalFetch;
  });
});
