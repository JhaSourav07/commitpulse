import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CompareClient from './CompareClient';

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock('@/hooks/useRecentSearches', () => ({
  useRecentSearches: () => ({
    searches: ['octocat vs dinesh9997'],
    addSearch: vi.fn(),
    removeSearch: vi.fn(),
    clearSearches: vi.fn(),
  }),
}));

describe('CompareClient Keyboard Navigation & ARIA Accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders input fields with accessible ARIA labels', () => {
    render(<CompareClient />);

    const user1Input = screen.getByLabelText(/enter first github username to compare/i);
    const user2Input = screen.getByLabelText(/enter second github username to compare/i);

    expect(user1Input).toBeInTheDocument();
    expect(user2Input).toBeInTheDocument();
  });

  it('renders submit compare button with proper aria-label', () => {
    render(<CompareClient />);

    const compareBtn = screen.getByRole('button', { name: /compare two github profiles/i });

    expect(compareBtn).toBeInTheDocument();
  });

  it('includes focus-visible class names on interactive controls', () => {
    render(<CompareClient />);

    const user1Input = screen.getByLabelText(/enter first github username to compare/i);
    const compareBtn = screen.getByRole('button', { name: /compare two github profiles/i });

    expect(user1Input.className).toContain('focus-visible:ring-2');
    expect(compareBtn.className).toContain('focus-visible:ring-2');
  });

  it('renders recent comparison history tags with accessible remove buttons', () => {
    render(<CompareClient />);

    const historyBtn = screen.getByRole('button', { name: 'octocat vs dinesh9997' });
    const removeBtn = screen.getByRole('button', {
      name: /remove octocat vs dinesh9997 from recent comparisions/i,
    });

    expect(historyBtn).toBeInTheDocument();
    expect(removeBtn).toBeInTheDocument();
  });
});
