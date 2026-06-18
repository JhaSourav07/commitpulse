// app/contributors/page.accessibility.test.tsx

import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
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

describe('ContributorsPage Accessibility', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: {
        get: () => null,
      },
      json: async () => [
        {
          id: 1,
          login: 'test-contributor-1',
          avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4',
          contributions: 42,
          html_url: 'https://github.com/test-contributor-1',
        },
        {
          id: 2,
          login: 'test-contributor-2',
          avatar_url: 'https://avatars.githubusercontent.com/u/2?v=4',
          contributions: 10,
          html_url: 'https://github.com/test-contributor-2',
        },
      ],
    } as unknown as Response);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('renders the contributors client container', async () => {
    const { default: ContributorsPage } = await import('./page');

    const page = await ContributorsPage();

    render(page);

    expect(screen.getByTestId('contributors-client')).toBeInTheDocument();
  });

  it('passes contributors array to accessible client layer', async () => {
    const { default: ContributorsPage } = await import('./page');

    const page = await ContributorsPage();

    render(page);

    expect(mockContributorsClient).toHaveBeenCalled();

    const props = mockContributorsClient.mock.calls[0][0] as ContributorsClientProps;

    expect(Array.isArray(props.contributors)).toBe(true);
  }, 60000);

  it('passes totalContributions to client component', async () => {
    const { default: ContributorsPage } = await import('./page');

    const page = await ContributorsPage();

    render(page);

    const props = mockContributorsClient.mock.calls[0][0] as ContributorsClientProps;

    expect(typeof props.totalContributions).toBe('number');
  });

  it('passes topContributors collection to client component', async () => {
    const { default: ContributorsPage } = await import('./page');

    const page = await ContributorsPage();

    render(page);

    const props = mockContributorsClient.mock.calls[0][0] as ContributorsClientProps;

    expect(Array.isArray(props.topContributors)).toBe(true);
  }, 60000);

  it('renders successfully when contributor data is empty', async () => {
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
  });
});
