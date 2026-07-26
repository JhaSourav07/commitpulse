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

const getHeaderTitle = () => screen.getByTestId('repo-header-title');
const getToggleBtn = () => screen.queryByRole('button', { name: /popular|pinned|starred/i });

// ─── Scale / Stress Tests ─────────────────────────────────────────────────────

describe('PopularRepos — massive scale stress tests', () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it('renders without crashing with 100 repos in each list', () => {
    const { container } = render(
      <PopularRepos
        popularRepos={makeRepos(100, 'pop')}
        pinnedRepos={makeRepos(100, 'pin')}
        starredRepos={makeRepos(100, 'star')}
      />
    );
    expect(container.firstChild).not.toBeNull();
  });

  it('still only renders 3 links with 100 popular repos', () => {
    render(<PopularRepos popularRepos={makeRepos(100, 'pop')} />);
    expect(screen.getAllByRole('link')).toHaveLength(3);
  });

  it('still only renders 3 links with 100 pinned repos after switching', () => {
    render(<PopularRepos popularRepos={popularRepos} pinnedRepos={makeRepos(100, 'pin')} />);
    fireEvent.click(getToggleBtn()!);
    fireEvent.click(screen.getByRole('option', { name: 'Pinned' }));
    expect(screen.getAllByRole('link')).toHaveLength(3);
  });

  it('still only renders 3 links with 100 starred repos after switching', () => {
    render(<PopularRepos popularRepos={popularRepos} starredRepos={makeRepos(100, 'star')} />);
    fireEvent.click(getToggleBtn()!);
    fireEvent.click(screen.getByRole('option', { name: 'Starred' }));
    expect(screen.getAllByRole('link')).toHaveLength(3);
  });

  it('dropdown still shows all 3 options with 100 repos per list', () => {
    render(
      <PopularRepos
        popularRepos={makeRepos(100, 'pop')}
        pinnedRepos={makeRepos(100, 'pin')}
        starredRepos={makeRepos(100, 'star')}
      />
    );
    fireEvent.click(getToggleBtn()!);
    expect(screen.getAllByRole('option')).toHaveLength(3);
  });

  it('can switch views rapidly 20 times without crashing', () => {
    render(
      <PopularRepos
        popularRepos={makeRepos(100, 'pop')}
        pinnedRepos={makeRepos(100, 'pin')}
        starredRepos={makeRepos(100, 'star')}
      />
    );
    for (let i = 0; i < 20; i++) {
      fireEvent.click(getToggleBtn()!);
      const opts = screen.getAllByRole('option');
      fireEvent.click(opts[i % 3]);
    }
    expect(getHeaderTitle()).toBeDefined();
  });

  it('renders repos with very long names (500 chars) without crashing', () => {
    const longName = 'a'.repeat(500);
    render(
      <PopularRepos
        popularRepos={[makeRepo({ name: longName, url: `https://github.com/user/${longName}` })]}
      />
    );
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  it('renders repos with very long descriptions (10000 chars) without crashing', () => {
    render(<PopularRepos popularRepos={[makeRepo({ description: 'x'.repeat(10000) })]} />);
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  it('4th repo and beyond are never rendered regardless of list size', () => {
    render(<PopularRepos popularRepos={makeRepos(50, 'pop')} />);
    expect(screen.queryByText('pop-4')).toBeNull();
    expect(screen.queryByText('pop-50')).toBeNull();
  });

  it('renders 1000 unique repos across all three lists without crashing', () => {
    const { container } = render(
      <PopularRepos
        popularRepos={makeRepos(1000, 'pop')}
        pinnedRepos={makeRepos(1000, 'pin')}
        starredRepos={makeRepos(1000, 'star')}
      />
    );
    expect(container.firstChild).not.toBeNull();
    // Still capped at 3
    expect(screen.getAllByRole('link')).toHaveLength(3);
  });

  it('handles repeated open/close of dropdown 50 times without crashing', () => {
    render(
      <PopularRepos popularRepos={makeRepos(100, 'pop')} pinnedRepos={makeRepos(100, 'pin')} />
    );
    for (let i = 0; i < 50; i++) {
      fireEvent.click(getToggleBtn()!);
    }
    expect(getHeaderTitle()).toBeDefined();
  });
});
