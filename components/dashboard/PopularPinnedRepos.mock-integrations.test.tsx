import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { PopularRepos } from './PopularPinnnedRepos';

vi.mock('lucide-react', () => ({
  ChevronDown: ({ className }: { className?: string }) => (
    <svg data-testid="chevron-icon" className={className} />
  ),
  Star: ({ className, strokeWidth }: { className?: string; strokeWidth?: number }) => (
    <svg data-testid="star-icon" className={className} strokeWidth={strokeWidth} />
  ),
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const makeRepo = (
  overrides: Partial<{
    name: string;
    description: string | null;
    stargazerCount: number;
    forkCount: number;
    url: string;
    primaryLanguage: { name: string; color: string } | null;
  }> = {}
) => ({
  name: 'my-repo',
  description: 'A great repo',
  stargazerCount: 42,
  forkCount: 5,
  url: 'https://github.com/user/my-repo',
  primaryLanguage: { name: 'TypeScript', color: '#3178c6' },
  ...overrides,
});

const popularRepos = [
  makeRepo({
    name: 'popular-repo-1',
    description: 'First popular',
    stargazerCount: 100,
    url: 'https://github.com/user/popular-repo-1',
  }),
  makeRepo({
    name: 'popular-repo-2',
    description: 'Second popular',
    stargazerCount: 80,
    url: 'https://github.com/user/popular-repo-2',
  }),
  makeRepo({
    name: 'popular-repo-3',
    description: 'Third popular',
    stargazerCount: 60,
    url: 'https://github.com/user/popular-repo-3',
  }),
];

const pinnedRepos = [
  makeRepo({
    name: 'pinned-repo-1',
    description: 'First pinned',
    stargazerCount: 30,
    url: 'https://github.com/user/pinned-repo-1',
  }),
  makeRepo({
    name: 'pinned-repo-2',
    description: 'Second pinned',
    stargazerCount: 20,
    url: 'https://github.com/user/pinned-repo-2',
  }),
];

const starredRepos = [
  makeRepo({
    name: 'starred-repo-1',
    description: 'First starred',
    stargazerCount: 500,
    url: 'https://github.com/user/starred-repo-1',
    primaryLanguage: { name: 'Go', color: '#00ADD8' },
  }),
  makeRepo({
    name: 'starred-repo-2',
    description: 'Second starred',
    stargazerCount: 300,
    url: 'https://github.com/user/starred-repo-2',
    primaryLanguage: { name: 'Rust', color: '#dea584' },
  }),
];

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PopularRepos — mock integration (starred + three-tab)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Starred tab content ───────────────────────────────────────────────────

  it('renders starred repo names after switching to Starred tab', () => {
    render(<PopularRepos popularRepos={popularRepos} starredRepos={starredRepos} />);
    fireEvent.click(screen.getByRole('button', { name: /popular/i }));
    fireEvent.click(screen.getByRole('option', { name: 'Starred' }));
    expect(screen.getByText('starred-repo-1')).toBeDefined();
    expect(screen.getByText('starred-repo-2')).toBeDefined();
  });

  it('renders starred repo descriptions', () => {
    render(<PopularRepos popularRepos={popularRepos} starredRepos={starredRepos} />);
    fireEvent.click(screen.getByRole('button', { name: /popular/i }));
    fireEvent.click(screen.getByRole('option', { name: 'Starred' }));
    expect(screen.getByText('First starred')).toBeDefined();
    expect(screen.getByText('Second starred')).toBeDefined();
  });

  it('renders starred repo language badges correctly', () => {
    render(<PopularRepos popularRepos={popularRepos} starredRepos={starredRepos} />);
    fireEvent.click(screen.getByRole('button', { name: /popular/i }));
    fireEvent.click(screen.getByRole('option', { name: 'Starred' }));
    expect(screen.getByText('Go')).toBeDefined();
    expect(screen.getByText('Rust')).toBeDefined();
  });

  it('starred repo cards have correct hrefs', () => {
    render(<PopularRepos popularRepos={popularRepos} starredRepos={starredRepos} />);
    fireEvent.click(screen.getByRole('button', { name: /popular/i }));
    fireEvent.click(screen.getByRole('option', { name: 'Starred' }));
    expect(screen.getByRole('link', { name: /starred-repo-1/i }).getAttribute('href')).toBe(
      'https://github.com/user/starred-repo-1'
    );
  });

  it('starred repo cards open in a new tab with correct rel', () => {
    render(<PopularRepos popularRepos={popularRepos} starredRepos={starredRepos} />);
    fireEvent.click(screen.getByRole('button', { name: /popular/i }));
    fireEvent.click(screen.getByRole('option', { name: 'Starred' }));
    screen.getAllByRole('link').forEach((link) => {
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    });
  });

  it('caps starred repos at 3 even when more are passed', () => {
    const manyStarred = Array.from({ length: 5 }, (_, i) =>
      makeRepo({ name: `starred-${i + 1}`, url: `https://github.com/user/starred-${i + 1}` })
    );
    render(<PopularRepos popularRepos={popularRepos} starredRepos={manyStarred} />);
    fireEvent.click(screen.getByRole('button', { name: /popular/i }));
    fireEvent.click(screen.getByRole('option', { name: 'Starred' }));
    expect(screen.getAllByRole('link')).toHaveLength(3);
  });

  // ── Star icon (mocked lucide Star) ───────────────────────────────────────

  it('Star icon is NOT rendered on popular view', () => {
    render(<PopularRepos popularRepos={popularRepos} starredRepos={starredRepos} />);
    expect(screen.queryByTestId('star-icon')).toBeNull();
  });

  it('Star icon IS rendered after switching to starred view', () => {
    render(<PopularRepos popularRepos={popularRepos} starredRepos={starredRepos} />);
    fireEvent.click(screen.getByRole('button', { name: /popular/i }));
    fireEvent.click(screen.getByRole('option', { name: 'Starred' }));
    expect(screen.getByTestId('star-icon')).toBeDefined();
  });

  it('Star icon is NOT rendered on pinned view', () => {
    render(
      <PopularRepos
        popularRepos={popularRepos}
        pinnedRepos={pinnedRepos}
        starredRepos={starredRepos}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /popular/i }));
    fireEvent.click(screen.getByRole('option', { name: 'Pinned' }));
    expect(screen.queryByTestId('star-icon')).toBeNull();
  });

  it('Star icon disappears again when switching away from starred view', () => {
    render(
      <PopularRepos
        popularRepos={popularRepos}
        pinnedRepos={pinnedRepos}
        starredRepos={starredRepos}
      />
    );
    // Go to Starred
    fireEvent.click(screen.getByRole('button', { name: /popular/i }));
    fireEvent.click(screen.getByRole('option', { name: 'Starred' }));
    expect(screen.getByTestId('star-icon')).toBeDefined();

    // Go back to Popular
    fireEvent.click(screen.getByRole('button', { name: /starred/i }));
    fireEvent.click(screen.getByRole('option', { name: 'Popular' }));
    expect(screen.queryByTestId('star-icon')).toBeNull();
  });

  // ── Header title ──────────────────────────────────────────────────────────

  it('header updates to "Starred Repositories" on starred view', () => {
    render(<PopularRepos popularRepos={popularRepos} starredRepos={starredRepos} />);
    fireEvent.click(screen.getByRole('button', { name: /popular/i }));
    fireEvent.click(screen.getByRole('option', { name: 'Starred' }));
    expect(screen.getByText('Starred Repositories')).toBeDefined();
  });

  it('never shows more than one heading at a time', () => {
    render(
      <PopularRepos
        popularRepos={popularRepos}
        pinnedRepos={pinnedRepos}
        starredRepos={starredRepos}
      />
    );
    expect(screen.queryByText('Pinned Repositories')).toBeNull();
    expect(screen.queryByText('Starred Repositories')).toBeNull();
    expect(screen.getByText('Popular Repositories')).toBeDefined();
  });

  // ── Three-tab dropdown options ────────────────────────────────────────────

  it('dropdown shows exactly 3 options when all three lists have data', () => {
    render(
      <PopularRepos
        popularRepos={popularRepos}
        pinnedRepos={pinnedRepos}
        starredRepos={starredRepos}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /popular/i }));
    expect(screen.getAllByRole('option')).toHaveLength(3);
  });

  it('all three option labels are present: Popular, Pinned, Starred', () => {
    render(
      <PopularRepos
        popularRepos={popularRepos}
        pinnedRepos={pinnedRepos}
        starredRepos={starredRepos}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /popular/i }));
    expect(screen.getByRole('option', { name: 'Popular' })).toBeDefined();
    expect(screen.getByRole('option', { name: 'Pinned' })).toBeDefined();
    expect(screen.getByRole('option', { name: 'Starred' })).toBeDefined();
  });

  it('Starred option is absent when starredRepos is not provided', () => {
    render(<PopularRepos popularRepos={popularRepos} pinnedRepos={pinnedRepos} />);
    fireEvent.click(screen.getByRole('button', { name: /popular/i }));
    expect(screen.getAllByRole('option')).toHaveLength(2);
    expect(screen.getAllByRole('option').map((o) => o.textContent)).not.toContain('Starred');
  });

  // ── Full three-tab cycle ──────────────────────────────────────────────────

  it('can cycle through all three tabs sequentially and shows correct repos each time', () => {
    render(
      <PopularRepos
        popularRepos={popularRepos}
        pinnedRepos={pinnedRepos}
        starredRepos={starredRepos}
      />
    );

    // Default: Popular
    expect(screen.getByText('popular-repo-1')).toBeDefined();

    // → Pinned
    fireEvent.click(screen.getByRole('button', { name: /popular/i }));
    fireEvent.click(screen.getByRole('option', { name: 'Pinned' }));
    expect(screen.getByText('pinned-repo-1')).toBeDefined();
    expect(screen.queryByText('popular-repo-1')).toBeNull();

    // → Starred
    fireEvent.click(screen.getByRole('button', { name: /pinned/i }));
    fireEvent.click(screen.getByRole('option', { name: 'Starred' }));
    expect(screen.getByText('starred-repo-1')).toBeDefined();
    expect(screen.queryByText('pinned-repo-1')).toBeNull();

    // → Back to Popular
    fireEvent.click(screen.getByRole('button', { name: /starred/i }));
    fireEvent.click(screen.getByRole('option', { name: 'Popular' }));
    expect(screen.getByText('popular-repo-1')).toBeDefined();
    expect(screen.queryByText('starred-repo-1')).toBeNull();
  });

  // ── aria-selected across all three tabs ──────────────────────────────────

  it('aria-selected is true only for Popular option by default', () => {
    render(
      <PopularRepos
        popularRepos={popularRepos}
        pinnedRepos={pinnedRepos}
        starredRepos={starredRepos}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /popular/i }));
    const [popular, pinned, starred] = screen.getAllByRole('option');
    expect(popular.getAttribute('aria-selected')).toBe('true');
    expect(pinned.getAttribute('aria-selected')).toBe('false');
    expect(starred.getAttribute('aria-selected')).toBe('false');
  });

  it('aria-selected moves to Starred after switching to starred', () => {
    render(
      <PopularRepos
        popularRepos={popularRepos}
        pinnedRepos={pinnedRepos}
        starredRepos={starredRepos}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /popular/i }));
    fireEvent.click(screen.getByRole('option', { name: 'Starred' }));

    fireEvent.click(screen.getByRole('button', { name: /starred/i }));
    const [popular, pinned, starred] = screen.getAllByRole('option');
    expect(popular.getAttribute('aria-selected')).toBe('false');
    expect(pinned.getAttribute('aria-selected')).toBe('false');
    expect(starred.getAttribute('aria-selected')).toBe('true');
  });

  // ── Two-tab subset combinations ───────────────────────────────────────────

  it('shows only Popular + Starred when pinnedRepos is absent', () => {
    render(<PopularRepos popularRepos={popularRepos} starredRepos={starredRepos} />);
    fireEvent.click(screen.getByRole('button', { name: /popular/i }));
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(2);
    expect(options[0].textContent).toBe('Popular');
    expect(options[1].textContent).toBe('Starred');
  });

  it('shows only Pinned + Starred when popularRepos is absent', () => {
    render(<PopularRepos pinnedRepos={pinnedRepos} starredRepos={starredRepos} />);
    // Default popular view is empty → dropdown button label is 'Popular'
    fireEvent.click(screen.getByRole('button', { name: /popular/i }));
    const labels = screen.getAllByRole('option').map((o) => o.textContent);
    expect(labels).toContain('Pinned');
    expect(labels).toContain('Starred');
    expect(labels).not.toContain('Popular');
  });

  it('no dropdown rendered when only starredRepos is provided (single tab)', () => {
    render(<PopularRepos starredRepos={starredRepos} />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
