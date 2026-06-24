import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import ContributorsSearch from './ContributorsSearch';

function expectContributorsCount(container: HTMLElement, filtered: number, total: number) {
  expect(container.textContent?.replace(/\s+/g, '').trim()).toContain(
    `${filtered}/${total}contributors`
  );
}

describe('ContributorsSearch empty fallback', () => {
  it('renders the fallback when the contributor collection is missing', () => {
    const { container } = render(<ContributorsSearch />);

    expect(screen.getByText('No architects found')).toBeTruthy();
    expectContributorsCount(container, 0, 0);
  });

  it('renders no contributor profile links for an empty collection', () => {
    render(<ContributorsSearch contributors={[]} />);

    expect(screen.getByText('No architects found')).toBeTruthy();
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('keeps the empty collection stable while searching and clearing', async () => {
    const user = userEvent.setup();
    const { container } = render(<ContributorsSearch contributors={[]} />);

    const input = screen.getByRole('textbox', { name: 'Search contributors by name' });
    await user.type(input, 'missing contributor');

    expect(screen.getByText('No architects found')).toBeTruthy();
    expectContributorsCount(container, 0, 0);

    await user.click(screen.getByRole('button', { name: 'Clear search' }));

    expect(input).toHaveValue('');
    expect(screen.getByText('No architects found')).toBeTruthy();
  });

  it('moves from populated results to the fallback and back', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ContributorsSearch
        contributors={[
          {
            id: 1,
            login: 'alice',
            avatar_url: 'https://example.com/alice.png',
            contributions: 42,
            html_url: 'https://github.com/alice',
          },
        ]}
      />
    );

    const input = screen.getByRole('textbox', { name: 'Search contributors by name' });
    expect(screen.getByRole('link', { name: /alice/i })).toBeTruthy();

    await user.type(input, 'missing');
    expect(screen.getByText('No architects found')).toBeTruthy();
    expect(screen.queryByRole('link')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(screen.getByRole('link', { name: /alice/i })).toBeTruthy();
    expectContributorsCount(container, 1, 1);
  });
});
