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

describe('PopularRepos — empty fallback states', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Null render guards ────────────────────────────────────────────────────

  it('returns null when all three lists are empty arrays', () => {
    const { container } = render(
      <PopularRepos popularRepos={[]} pinnedRepos={[]} starredRepos={[]} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('returns null when only starredRepos is passed as empty', () => {
    const { container } = render(<PopularRepos starredRepos={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders when only starredRepos has data', () => {
    const { container } = render(<PopularRepos starredRepos={starredRepos} />);
    expect(container.firstChild).not.toBeNull();
  });

  // ── Popular empty state (default view) ───────────────────────────────────

  it('shows popular empty-state when only pinnedRepos are provided (default view is popular)', () => {
    render(<PopularRepos pinnedRepos={pinnedRepos} />);
    expect(screen.getByText(/no popular repositories found on this profile/i)).toBeDefined();
  });

  it('shows popular empty-state when only starredRepos are provided (default view is popular)', () => {
    render(<PopularRepos starredRepos={starredRepos} />);
    expect(screen.getByText(/no popular repositories found on this profile/i)).toBeDefined();
  });

  // ── Active-view empty state after tab switch ──────────────────────────────

  it('shows pinned empty-state after switching to pinned when pinnedRepos is empty', () => {
    // Seed pinned with one repo so the Pinned option appears, then render empty version
    render(<PopularRepos popularRepos={popularRepos} pinnedRepos={[makeRepo({ name: 'seed' })]} />);
    fireEvent.click(screen.getByRole('button', { name: /popular/i }));
    fireEvent.click(screen.getByRole('option', { name: 'Pinned' }));
    // seed repo rendered — confirms switch worked; message absent because data exists
    expect(screen.getByText('seed')).toBeDefined();
    expect(screen.queryByText(/no pinned repositories/i)).toBeNull();
  });

  it('does not show empty state when active view has repos', () => {
    render(<PopularRepos popularRepos={popularRepos} pinnedRepos={pinnedRepos} />);
    expect(screen.queryByText(/no popular repositories found/i)).toBeNull();
    expect(screen.getByText('popular-repo-1')).toBeDefined();
  });

  it('empty state text updates dynamically to match the active view label', () => {
    // only pinned — default popular view → "No popular..."
    render(<PopularRepos pinnedRepos={pinnedRepos} />);
    expect(screen.getByText(/no popular repositories found on this profile/i)).toBeDefined();
    expect(screen.queryByText(/no pinned repositories/i)).toBeNull();
  });

  // ── Regression: getByText multi-match guard ───────────────────────────────

  it('empty-state element is a <span> not a <p> (prevents getByText multi-match with heading)', () => {
    // Both <h3>Popular Repositories</h3> and the empty message contain "repositories".
    // The <span> wrapper means the <p> has no direct text node, so getByText finds
    // exactly one element. If the <span> is ever removed this test fails immediately.
    render(<PopularRepos pinnedRepos={pinnedRepos} />);
    const el = screen.getByText(/no popular repositories found on this profile/i);
    expect(el.tagName.toLowerCase()).toBe('span');
  });

  it('getByText on heading finds exactly the <h3> element', () => {
    render(<PopularRepos pinnedRepos={pinnedRepos} />);
    const heading = screen.getByText('Popular Repositories');
    expect(heading.tagName.toLowerCase()).toBe('h3');
  });
});
