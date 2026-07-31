import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';
import { WallOfLove } from './WallOfLove';

vi.stubGlobal(
  'fetch',
  vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ success: true, reviews: [] }),
  })
);

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    p: (props: React.ComponentProps<'p'>) => <p {...props} />,
  },
  useReducedMotion: () => true,
}));

// Mock gsap
vi.mock('gsap', () => {
  const timeline = () => ({
    to: vi.fn(),
    fromTo: vi.fn(),
    kill: vi.fn(),
  });

  return {
    default: {
      registerPlugin: vi.fn(),
      context: (cb: () => void) => {
        cb();
        return { revert: vi.fn() };
      },
      timeline,
      to: vi.fn(),
      set: vi.fn(),
    },
  };
});

vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: {},
}));

describe('WallOfLove Search, Rating Filter, Platform Filter & Sort Controls', () => {
  it('renders control bar with search input, platform buttons, rating select, and sort select', () => {
    render(<WallOfLove />);

    expect(screen.getByPlaceholderText('Search reviews or author...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /all/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /twitter/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /github/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /filter by rating/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /sort testimonials/i })).toBeInTheDocument();
  });

  it('filters testimonials by search query', () => {
    render(<WallOfLove />);

    const searchInput = screen.getByPlaceholderText('Search reviews or author...');
    fireEvent.change(searchInput, { target: { value: 'Priya' } });

    expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
    expect(screen.queryByText('Marcus Johnson')).not.toBeInTheDocument();
  });

  it('filters testimonials by platform', () => {
    render(<WallOfLove />);

    const githubButton = screen.getByRole('button', { name: /github/i });
    fireEvent.click(githubButton);

    expect(screen.getByText('Marcus Johnson')).toBeInTheDocument();
    expect(screen.queryByText('Alex Chen')).not.toBeInTheDocument();
  });

  it('filters testimonials by star rating', () => {
    render(<WallOfLove />);

    const ratingSelect = screen.getByRole('combobox', { name: /filter by rating/i });
    fireEvent.change(ratingSelect, { target: { value: '4+' } });

    expect(screen.getByText('Marcus Johnson')).toBeInTheDocument();
  });

  it('sorts testimonials by rating or date option', () => {
    render(<WallOfLove />);

    const sortSelect = screen.getByRole('combobox', { name: /sort testimonials/i });
    fireEvent.change(sortSelect, { target: { value: 'newest' } });

    expect(sortSelect).toHaveValue('newest');
  });

  it('renders empty state when no matching testimonials found and clears filters', () => {
    render(<WallOfLove />);

    const searchInput = screen.getByPlaceholderText('Search reviews or author...');
    fireEvent.change(searchInput, { target: { value: 'NonExistentAuthorQuery12345' } });

    expect(screen.getByText('No reviews found')).toBeInTheDocument();

    const clearButton = screen.getByRole('button', { name: /clear filters/i });
    fireEvent.click(clearButton);

    expect(searchInput).toHaveValue('');
  });
});
