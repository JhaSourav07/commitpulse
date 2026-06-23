/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { PopularRepos } from './PopularPinnnedRepos';

vi.mock('lucide-react', () => ({
  ChevronDown: ({ className, ...props }: any) => (
    <svg data-testid="chevron-icon" className={className} {...props} />
  ),
  Star: ({ className, ...props }: any) => (
    <svg data-testid="star-icon" className={className} {...props} />
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
  name: 'repo',
  description: 'A repo',
  stargazerCount: 10,
  forkCount: 2,
  url: 'https://github.com/user/repo',
  primaryLanguage: { name: 'TypeScript', color: '#3178c6' },
  ...overrides,
});

const makeRepos = (n: number, prefix: string) =>
  Array.from({ length: n }, (_, i) =>
    makeRepo({ name: `${prefix}-${i + 1}`, url: `https://github.com/user/${prefix}-${i + 1}` })
  );

const popularRepos = makeRepos(3, 'popular');
const pinnedRepos = makeRepos(2, 'pinned');
const starredRepos = makeRepos(3, 'starred');

const getHeaderTitle = () => screen.getByTestId('repo-header-title');
const getToggleBtn = () => screen.queryByRole('button', { name: /popular|pinned|starred/i });

// ─── Error Resilience Tests ───────────────────────────────────────────────────

describe('PopularRepos — error resilience', () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => vi.restoreAllMocks());

  // ── Edge-case prop values ──────────────────────────────────────────────────

  it('renders without crashing when stargazerCount is 0', () => {
    render(<PopularRepos popularRepos={[makeRepo({ stargazerCount: 0 })]} />);
    expect(screen.getByText('0')).toBeDefined();
  });

  it('renders without crashing when forkCount is 0', () => {
    const { container } = render(<PopularRepos popularRepos={[makeRepo({ forkCount: 0 })]} />);
    expect(container.firstChild).not.toBeNull();
  });

  it('renders correctly when stargazerCount is Number.MAX_SAFE_INTEGER', () => {
    render(<PopularRepos popularRepos={[makeRepo({ stargazerCount: Number.MAX_SAFE_INTEGER })]} />);
    expect(screen.getByText(String(Number.MAX_SAFE_INTEGER))).toBeDefined();
  });

  it('renders safely when description is null', () => {
    render(<PopularRepos popularRepos={[makeRepo({ description: null })]} />);
    expect(screen.getByText('No description provided.')).toBeDefined();
  });

  it('renders safely when description is an empty string', () => {
    render(<PopularRepos popularRepos={[makeRepo({ description: '' })]} />);
    expect(screen.getByText('No description provided.')).toBeDefined();
  });

  it('renders safely when primaryLanguage is null', () => {
    const { container } = render(
      <PopularRepos popularRepos={[makeRepo({ primaryLanguage: null })]} />
    );
    expect(container.firstChild).not.toBeNull();
  });

  it('renders safely when primaryLanguage color is an empty string', () => {
    const { container } = render(
      <PopularRepos
        popularRepos={[makeRepo({ primaryLanguage: { name: 'Unknown', color: '' } })]}
      />
    );
    expect(container.firstChild).not.toBeNull();
  });

  it('renders safely when url is an empty string', () => {
    const { container } = render(<PopularRepos popularRepos={[makeRepo({ url: '' })]} />);
    expect(container.firstChild).not.toBeNull();
  });

  it('handles repos with duplicate names without crashing', () => {
    const dupes = [
      makeRepo({ name: 'same', url: 'https://github.com/user/same' }),
      makeRepo({ name: 'same', url: 'https://github.com/user/same' }),
      makeRepo({ name: 'same', url: 'https://github.com/user/same' }),
    ];
    const { container } = render(<PopularRepos popularRepos={dupes} />);
    expect(container.firstChild).not.toBeNull();
  });

  // ── Lifecycle / memory ─────────────────────────────────────────────────────

  it('unmounts and remounts without memory errors', () => {
    const { unmount } = render(
      <PopularRepos
        popularRepos={popularRepos}
        pinnedRepos={pinnedRepos}
        starredRepos={starredRepos}
      />
    );
    unmount();
    const { container } = render(<PopularRepos popularRepos={popularRepos} />);
    expect(container.firstChild).not.toBeNull();
  });

  it('event listener is cleaned up on unmount — removeEventListener called exactly as many times as addEventListener', () => {
    const addSpy = vi.spyOn(document, 'addEventListener');
    const removeSpy = vi.spyOn(document, 'removeEventListener');

    const { unmount } = render(
      <PopularRepos popularRepos={popularRepos} pinnedRepos={pinnedRepos} />
    );

    const addCount = addSpy.mock.calls.filter(([e]) => e === 'mousedown').length;
    unmount();
    const removeCount = removeSpy.mock.calls.filter(([e]) => e === 'mousedown').length;

    expect(removeCount).toBe(addCount);
  });

  it('outside click after unmount does not throw', () => {
    const { unmount } = render(
      <div>
        <PopularRepos popularRepos={popularRepos} pinnedRepos={pinnedRepos} />
        <div data-testid="outside">outside</div>
      </div>
    );
    fireEvent.click(getToggleBtn()!);
    unmount();
    expect(() => fireEvent.mouseDown(document.body)).not.toThrow();
  });

  // ── Interaction resilience ─────────────────────────────────────────────────

  it('does not crash when switching views back and forth many times', () => {
    render(
      <PopularRepos
        popularRepos={popularRepos}
        pinnedRepos={pinnedRepos}
        starredRepos={starredRepos}
      />
    );
    const views = ['Pinned', 'Starred', 'Popular', 'Starred', 'Pinned', 'Popular'];
    for (const view of views) {
      fireEvent.click(getToggleBtn()!);
      fireEvent.click(screen.getByRole('option', { name: view }));
    }
    expect(getHeaderTitle().textContent).toBe('Popular Repositories');
  });

  it('re-selecting the already-active view does not break state', () => {
    render(<PopularRepos popularRepos={popularRepos} pinnedRepos={pinnedRepos} />);
    fireEvent.click(getToggleBtn()!);
    fireEvent.click(screen.getByRole('option', { name: 'Popular' }));
    expect(getHeaderTitle().textContent).toBe('Popular Repositories');
    expect(screen.getByText('popular-1')).toBeDefined();
  });

  it('dropdown closes cleanly even if nothing is selected', () => {
    render(<PopularRepos popularRepos={popularRepos} pinnedRepos={pinnedRepos} />);
    fireEvent.click(getToggleBtn()!);
    // Close by clicking outside without selecting
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('listbox')).toBeNull();
    // State should be unchanged
    expect(getHeaderTitle().textContent).toBe('Popular Repositories');
  });

  it('renders correctly after receiving new props (starredRepos added after mount)', () => {
    const { rerender } = render(
      <PopularRepos popularRepos={popularRepos} pinnedRepos={pinnedRepos} />
    );
    // Initially no starred tab
    fireEvent.click(getToggleBtn()!);
    expect(screen.queryByRole('option', { name: 'Starred' })).toBeNull();
    fireEvent.mouseDown(document.body);

    // Re-render with starredRepos added
    rerender(
      <PopularRepos
        popularRepos={popularRepos}
        pinnedRepos={pinnedRepos}
        starredRepos={starredRepos}
      />
    );
    fireEvent.click(getToggleBtn()!);
    expect(screen.getByRole('option', { name: 'Starred' })).toBeDefined();
  });

  it('renders correctly when starredRepos is removed after being present', () => {
    const { rerender } = render(
      <PopularRepos
        popularRepos={popularRepos}
        pinnedRepos={pinnedRepos}
        starredRepos={starredRepos}
      />
    );
    // Switch to starred
    fireEvent.click(getToggleBtn()!);
    fireEvent.click(screen.getByRole('option', { name: 'Starred' }));
    expect(getHeaderTitle().textContent).toBe('Starred Repositories');

    // Remove starredRepos — component should gracefully fall back
    rerender(
      <PopularRepos popularRepos={popularRepos} pinnedRepos={pinnedRepos} starredRepos={[]} />
    );
    // Starred tab gone, only 2 options remain
    fireEvent.click(getToggleBtn()!);
    expect(screen.getAllByRole('option')).toHaveLength(2);
    expect(screen.queryByRole('option', { name: 'Starred' })).toBeNull();
  });
});
