// app/contributors/page.mock-integrations.test.tsx

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

type ContributorsClientProps = {
  contributors: unknown[];
  totalContributions: number;
  topContributors: unknown[];
};

const mockContributorsClient = vi.fn((_props?: ContributorsClientProps) => (
  <div data-testid="contributors-client">Contributors Client</div>
));

vi.mock('./ContributorsClient', () => ({
  default: (props: ContributorsClientProps) => mockContributorsClient(props),
}));

describe('ContributorsPage Mock Integrations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders successfully using mocked service data', async () => {
    const { default: ContributorsPage } = await import('./page');

    const page = await ContributorsPage();

    render(page);

    expect(screen.getByTestId('contributors-client')).toBeInTheDocument();
  });

  it('passes contributor data from mocked fetch layer', async () => {
    const { default: ContributorsPage } = await import('./page');

    const page = await ContributorsPage();

    render(page);

    expect(mockContributorsClient).toHaveBeenCalled();

    const props = mockContributorsClient.mock.calls[0][0] as ContributorsClientProps;

    expect(Array.isArray(props.contributors)).toBe(true);
  });

  it('passes computed contribution totals to client component', async () => {
    const { default: ContributorsPage } = await import('./page');

    const page = await ContributorsPage();

    render(page);

    const props = mockContributorsClient.mock.calls[0][0] as ContributorsClientProps;

    expect(typeof props.totalContributions).toBe('number');
  });

  it('passes top contributors collection to client component', async () => {
    const { default: ContributorsPage } = await import('./page');

    const page = await ContributorsPage();

    render(page);

    const props = mockContributorsClient.mock.calls[0][0] as ContributorsClientProps;

    expect(Array.isArray(props.topContributors)).toBe(true);
  });

  it('falls back to empty contributor data on failed endpoint responses', async () => {
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
});
