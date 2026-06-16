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

describe('PopularRepos — mouse interactions', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Dropdown open / close ─────────────────────────────────────────────────

  it('dropdown is closed by default', () => {
    render(<PopularRepos popularRepos={popularRepos} pinnedRepos={pinnedRepos} />);
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('dropdown opens on toggle button click', () => {
    render(<PopularRepos popularRepos={popularRepos} pinnedRepos={pinnedRepos} />);
    fireEvent.click(screen.getByRole('button', { name: /popular/i }));
    expect(screen.getByRole('listbox')).toBeDefined();
  });

  it('dropdown closes when toggle button is clicked a second time', () => {
    render(<PopularRepos popularRepos={popularRepos} pinnedRepos={pinnedRepos} />);
    const btn = screen.getByRole('button', { name: /popular/i });
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('clicking outside the dropdown ref closes it', () => {
    render(
      <div>
        <PopularRepos popularRepos={popularRepos} pinnedRepos={pinnedRepos} />
        <button data-testid="outside">Outside</button>
      </div>
    );
    fireEvent.click(screen.getByRole('button', { name: /popular/i }));
    expect(screen.getByRole('listbox')).toBeDefined();

    // mousedown outside the ref triggers the outside-click handler
    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('mousedown inside the dropdown does NOT close it before option click fires', () => {
    render(<PopularRepos popularRepos={popularRepos} pinnedRepos={pinnedRepos} />);
    fireEvent.click(screen.getByRole('button', { name: /popular/i }));

    const option = screen.getByRole('option', { name: 'Pinned' });
    fireEvent.mouseDown(option); // simulates the press before release
    // listbox must still be visible so the subsequent click can register
    expect(screen.getByRole('listbox')).toBeDefined();
  });

  it('selecting an option closes the dropdown', () => {
    render(<PopularRepos popularRepos={popularRepos} pinnedRepos={pinnedRepos} />);
    fireEvent.click(screen.getByRole('button', { name: /popular/i }));
    fireEvent.click(screen.getByRole('option', { name: 'Pinned' }));
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('selecting the already-active option still closes the dropdown', () => {
    render(<PopularRepos popularRepos={popularRepos} pinnedRepos={pinnedRepos} />);
    fireEvent.click(screen.getByRole('button', { name: /popular/i }));
    fireEvent.click(screen.getByRole('option', { name: 'Popular' }));
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  // ── aria-expanded state ───────────────────────────────────────────────────

  it('toggle button starts with aria-expanded="false"', () => {
    render(<PopularRepos popularRepos={popularRepos} pinnedRepos={pinnedRepos} />);
    expect(screen.getByRole('button', { name: /popular/i }).getAttribute('aria-expanded')).toBe(
      'false'
    );
  });

  it('toggle button has aria-expanded="true" while dropdown is open', () => {
    render(<PopularRepos popularRepos={popularRepos} pinnedRepos={pinnedRepos} />);
    const btn = screen.getByRole('button', { name: /popular/i });
    fireEvent.click(btn);
    expect(btn.getAttribute('aria-expanded')).toBe('true');
  });

  it('aria-expanded correctly toggles through two open/close cycles', () => {
    render(<PopularRepos popularRepos={popularRepos} pinnedRepos={pinnedRepos} />);
    const btn = screen.getByRole('button', { name: /popular/i });

    fireEvent.click(btn);
    expect(btn.getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(btn);
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(btn);
    expect(btn.getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(btn);
    expect(btn.getAttribute('aria-expanded')).toBe('false');
  });

  // ── Tab switch updates ────────────────────────────────────────────────────

  it('switching tabs via mouse updates the repo list immediately', () => {
    render(
      <PopularRepos
        popularRepos={popularRepos}
        pinnedRepos={pinnedRepos}
        starredRepos={starredRepos}
      />
    );
    expect(screen.getByText('popular-repo-1')).toBeDefined();
    expect(screen.queryByText('pinned-repo-1')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /popular/i }));
    fireEvent.click(screen.getByRole('option', { name: 'Pinned' }));

    expect(screen.queryByText('popular-repo-1')).toBeNull();
    expect(screen.getByText('pinned-repo-1')).toBeDefined();
  });

  it('can switch back from Pinned to Popular via mouse', () => {
    render(<PopularRepos popularRepos={popularRepos} pinnedRepos={pinnedRepos} />);

    fireEvent.click(screen.getByRole('button', { name: /popular/i }));
    fireEvent.click(screen.getByRole('option', { name: 'Pinned' }));
    fireEvent.click(screen.getByRole('button', { name: /pinned/i }));
    fireEvent.click(screen.getByRole('option', { name: 'Popular' }));

    expect(screen.getByText('popular-repo-1')).toBeDefined();
    expect(screen.queryByText('pinned-repo-1')).toBeNull();
  });

  it('can switch to Starred view options and renders custom icons cleanly', () => {
    render(
      <PopularRepos
        popularRepos={popularRepos}
        pinnedRepos={pinnedRepos}
        starredRepos={starredRepos}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /popular/i }));
    fireEvent.click(screen.getByRole('option', { name: 'Starred' }));

    expect(screen.queryByText('popular-repo-1')).toBeNull();
    expect(screen.getByText('starred-repo-1')).toBeDefined();
    expect(screen.getByTestId('star-icon')).toBeDefined();
  });

  it('repo card links are navigable (correct href present)', () => {
    render(<PopularRepos popularRepos={popularRepos} />);
    const link = screen.getByRole('link', { name: /popular-repo-1/i });
    expect(link.getAttribute('href')).toBe('https://github.com/user/popular-repo-1');
  });

  it('all repo card links open in a new tab with rel="noopener noreferrer"', () => {
    render(<PopularRepos popularRepos={popularRepos} />);
    screen.getAllByRole('link').forEach((link) => {
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    });
  });

  // ── Chevron rotation ──────────────────────────────────────────────────────

  it('chevron does not have rotate-180 when dropdown is closed', () => {
    render(<PopularRepos popularRepos={popularRepos} pinnedRepos={pinnedRepos} />);
    expect(screen.getByTestId('chevron-icon').className).not.toContain('rotate-180');
  });

  it('chevron has rotate-180 class while dropdown is open', () => {
    render(<PopularRepos popularRepos={popularRepos} pinnedRepos={pinnedRepos} />);
    fireEvent.click(screen.getByRole('button', { name: /popular/i }));
    expect(screen.getByTestId('chevron-icon')).toHaveClass('rotate-180');
  });

  it('chevron loses rotate-180 class after dropdown is closed again', () => {
    render(<PopularRepos popularRepos={popularRepos} pinnedRepos={pinnedRepos} />);
    const btn = screen.getByRole('button', { name: /popular/i });
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(screen.getByTestId('chevron-icon').className).not.toContain('rotate-180');
  });
});
