import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContributorsSearch from './ContributorsSearch';

const mockContributors = [
  {
    id: 1,
    login: 'alice',
    avatar_url: 'https://example.com/alice.png',
    contributions: 42,
    html_url: 'https://github.com/alice',
  },
  {
    id: 2,
    login: 'bob',
    avatar_url: 'https://example.com/bob.png',
    contributions: 17,
    html_url: 'https://github.com/bob',
  },
];

describe('ContributorsSearch', () => {
  it('renders without crashing', () => {
    render(<ContributorsSearch contributors={mockContributors} />);
    screen.getByRole('textbox');
  });

  it('renders a search input', () => {
    render(<ContributorsSearch contributors={mockContributors} />);
    const input = screen.getByPlaceholderText(/search contributors by name/i);
    expect(input).toBeTruthy();
  });

  it('renders contributor cards for all contributors', () => {
    render(<ContributorsSearch contributors={mockContributors} />);
    screen.getByText('alice');
    screen.getByText('bob');
  });

  it('renders contributor login name and contributions count', () => {
    render(<ContributorsSearch contributors={mockContributors} />);
    screen.getByText('alice');
    screen.getByText('42 contributions');
  });

  it('filters contributors based on search input', async () => {
    const user = userEvent.setup();
    render(<ContributorsSearch contributors={mockContributors} />);
    const input = screen.getByPlaceholderText(/search contributors by name/i);
    await user.type(input, 'alice');
    screen.getByText('alice');
    expect(screen.queryByText('bob')).toBeNull();
  });

  it('shows "No contributors found" when search has no matches', async () => {
    const user = userEvent.setup();
    render(<ContributorsSearch contributors={mockContributors} />);
    const input = screen.getByPlaceholderText(/search contributors by name/i);
    await user.type(input, 'xyz123');
    screen.getByText(/no contributors found/i);
  });
});
