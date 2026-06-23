import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';

type Contributor = {
  id: number;
  login: string;
  avatar_url: string;
  contributions: number;
  html_url: string;
};

type ContributorsClientProps = {
  contributors: Contributor[];
  totalContributions: number;
  topContributors: Contributor[];
};

const mockContributorsClient = vi.fn((props: ContributorsClientProps) => {
  void props;

  return <div data-testid="contributors-client">Contributors Client</div>;
});

vi.mock('./ContributorsClient', () => ({
  default: (props: ContributorsClientProps) => mockContributorsClient(props),
}));

function contributor(id: number, contributions: number): Contributor {
  return {
    id,
    login: `contributor-${id}`,
    avatar_url: `https://avatars.githubusercontent.com/u/${id}?v=4`,
    contributions,
    html_url: `https://github.com/contributor-${id}`,
  };
}

describe('ContributorsPage top contributors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('ranks the global top 6 by contributions even when the highest contributors are not first in API order', async () => {
    // The two highest contributors are at positions 7 and 8, beyond the first 6.
    // A slice-before-sort would miss them; a sort-before-slice keeps them.
    const unordered = [
      contributor(1, 1),
      contributor(2, 2),
      contributor(3, 3),
      contributor(4, 4),
      contributor(5, 5),
      contributor(6, 6),
      contributor(7, 100),
      contributor(8, 99),
    ];

    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => unordered,
    });
    vi.stubGlobal('fetch', fetchMock);

    const { default: ContributorsPage } = await import('./page');
    const page = await ContributorsPage();
    render(page);

    const props = mockContributorsClient.mock.calls[0][0] as ContributorsClientProps;

    expect(props.topContributors).toHaveLength(6);
    expect(props.topContributors.map((c) => c.contributions)).toEqual([100, 99, 6, 5, 4, 3]);
    // The full contributors list is passed through untouched (not mutated by the ranking).
    expect(props.contributors.map((c) => c.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });
});
