import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';

import { PopularRepos } from './PopularPinnnedRepos';

const mockRepo = {
  name: 'commitpulse',
  description: 'Repository description',
  stargazerCount: 100,
  forkCount: 20,
  url: 'https://github.com/test/repo',
  primaryLanguage: {
    name: 'TypeScript',
    color: '#3178c6',
  },
};

describe('PopularRepos Accessibility', () => {
  it('renders repository section heading for screen readers', () => {
    render(<PopularRepos popularRepos={[mockRepo]} />);

    expect(
      screen.getByRole('heading', {
        name: /popular repositories/i,
      })
    ).toBeInTheDocument();
  });

  it('renders dropdown trigger with correct accessibility attributes', () => {
    render(<PopularRepos popularRepos={[mockRepo]} pinnedRepos={[mockRepo]} />);

    const trigger = screen.getByRole('button', {
      name: /popular/i,
    });

    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens accessible listbox when activated', async () => {
    const user = userEvent.setup();

    render(<PopularRepos popularRepos={[mockRepo]} pinnedRepos={[mockRepo]} />);

    await user.click(
      screen.getByRole('button', {
        name: /popular/i,
      })
    );

    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('renders selectable repository views as accessible options', async () => {
    const user = userEvent.setup();

    render(
      <PopularRepos popularRepos={[mockRepo]} pinnedRepos={[mockRepo]} starredRepos={[mockRepo]} />
    );

    await user.click(
      screen.getByRole('button', {
        name: /popular/i,
      })
    );

    const popularOption = screen.getByRole('option', {
      name: /popular/i,
    });

    expect(popularOption).toHaveAttribute('aria-selected', 'true');
  });

  it('repository links provide accessible names for screen readers', () => {
    render(<PopularRepos popularRepos={[mockRepo]} />);

    expect(
      screen.getByRole('link', {
        name: /commitpulse/i,
      })
    ).toBeInTheDocument();
  });
});
