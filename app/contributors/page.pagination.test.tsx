import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';

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

function contributor(id: number) {
  return {
    id,
    login: `contributor-${id}`,
    avatar_url: `https://avatars.githubusercontent.com/u/${id}?v=4`,
    contributions: id,
    html_url: `https://github.com/contributor-${id}`,
  };
}

describe('ContributorsPage pagination', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('loads every GitHub contributors page until the final partial page', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => Array.from({ length: 100 }, (_, index) => contributor(index + 1)),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => Array.from({ length: 100 }, (_, index) => contributor(index + 101)),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => Array.from({ length: 12 }, (_, index) => contributor(index + 201)),
      });
    vi.stubGlobal('fetch', fetchMock);

    const { default: ContributorsPage } = await import('./page');
    const page = await ContributorsPage();
    render(page);

    const props = mockContributorsClient.mock.calls[0][0] as ContributorsClientProps;
    expect(props.contributors).toHaveLength(212);
    expect(props.totalContributions).toBe(22578);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls.map((call) => call[0])).toEqual([
      'https://api.github.com/repos/JhaSourav07/commitpulse/contributors?per_page=100&page=1',
      'https://api.github.com/repos/JhaSourav07/commitpulse/contributors?per_page=100&page=2',
      'https://api.github.com/repos/JhaSourav07/commitpulse/contributors?per_page=100&page=3',
    ]);
  });

  it('stops immediately when the first page is already partial', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => [contributor(1), contributor(2)],
    });
    vi.stubGlobal('fetch', fetchMock);

    const { default: ContributorsPage } = await import('./page');
    const page = await ContributorsPage();
    render(page);

    const props = mockContributorsClient.mock.calls[0][0] as ContributorsClientProps;
    expect(props.contributors).toHaveLength(2);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
