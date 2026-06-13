import { fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PopularRepos } from './PopularPinnnedRepos';

vi.mock('lucide-react', () => ({
  ChevronDown: ({ className }: { className?: string }) => (
    <svg data-testid="chevron-icon" className={className} />
  ),
  Star: ({ className }: { className?: string }) => (
    <svg data-testid="star-icon" className={className} />
  ),
}));

type Scheme = 'light' | 'dark';

const tokenHex = {
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray600: '#4b5563',
  gray700: '#374151',
  neutral900: '#171717',
  neutral950: '#0a0a0a',
  zinc300: '#d4d4d8',
  zinc400: '#a1a1aa',
  purple50: '#faf5ff',
  purple400: '#c084fc',
  purple600: '#9333ea',
  white: '#ffffff',
} as const;

function mockThemeEnvironment(scheme: Scheme) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query === `(prefers-color-scheme: ${scheme})`,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
  document.documentElement.classList.toggle('dark', scheme === 'dark');
  document.documentElement.style.colorScheme = scheme;
}

function makeRepo(
  overrides: Partial<{
    name: string;
    description: string | null;
    stargazerCount: number;
    forkCount: number;
    url: string;
    primaryLanguage: { name: string; color: string } | null;
  }> = {}
) {
  return {
    name: 'popular-repo',
    description: 'A repository with premium themed card styling',
    stargazerCount: 128,
    forkCount: 12,
    url: 'https://github.com/user/popular-repo',
    primaryLanguage: { name: 'TypeScript', color: '#3178c6' },
    ...overrides,
  };
}

const popularRepos = [
  makeRepo({
    name: 'popular-alpha',
    description: 'Alpha repository with premium themed card styling',
    stargazerCount: 128,
  }),
  makeRepo({
    name: 'popular-beta',
    description: 'Beta repository with premium themed card styling',
    stargazerCount: 96,
  }),
];

const pinnedRepos = [
  makeRepo({
    name: 'pinned-alpha',
    description: 'Pinned project with a strong theme surface',
    stargazerCount: 64,
    url: 'https://github.com/user/pinned-alpha',
  }),
];

const starredRepos = [
  makeRepo({
    name: 'starred-alpha',
    description: 'Starred project with amber icon styling',
    stargazerCount: 256,
    url: 'https://github.com/user/starred-alpha',
  }),
];

function renderRepos(scheme: Scheme = 'light') {
  mockThemeEnvironment(scheme);
  return render(
    <PopularRepos
      popularRepos={popularRepos}
      pinnedRepos={pinnedRepos}
      starredRepos={starredRepos}
    />
  );
}

function classList(element: Element | null) {
  expect(element).not.toBeNull();
  return element!.className.split(/\s+/);
}

function getRepoPanel() {
  const title = screen.getByTestId('repo-header-title');
  const headerContent = title.parentElement;
  const headerRow = headerContent?.parentElement;
  const panel = headerRow?.parentElement;

  expect(panel).toBeInstanceOf(HTMLDivElement);
  return panel as HTMLDivElement;
}

function contrastRatio(foreground: string, background: string) {
  const luminance = (hex: string) => {
    const [r, g, b] = hex
      .replace('#', '')
      .match(/.{2}/g)!
      .map((value) => Number.parseInt(value, 16) / 255)
      .map((channel) =>
        channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
      );

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('PopularRepos dark/light visual cohesion', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = '';
  });

  it('emulates light and dark color-scheme presets while rendering real repository cards', () => {
    for (const scheme of ['light', 'dark'] as const) {
      const { unmount } = renderRepos(scheme);

      expect(window.matchMedia(`(prefers-color-scheme: ${scheme})`).matches).toBe(true);
      expect(document.documentElement.style.colorScheme).toBe(scheme);
      expect(screen.getByTestId('repo-header-title')).toHaveTextContent('Popular Repositories');
      expect(screen.getByRole('link', { name: /popular-alpha/i })).toBeInTheDocument();

      unmount();
    }
  });

  it('applies paired light and dark surface classes to the panel, dropdown, and repo card', () => {
    renderRepos('dark');

    const panel = getRepoPanel();
    const dropdown = screen.getByRole('button', { name: /popular/i });
    const repoCard = screen.getByRole('link', { name: /popular-alpha/i });

    expect(classList(panel)).toEqual(
      expect.arrayContaining([
        'border-gray-200',
        'dark:border-neutral-800',
        'bg-white',
        'dark:bg-neutral-950',
      ])
    );
    expect(classList(dropdown)).toEqual(
      expect.arrayContaining([
        'bg-gray-50',
        'hover:bg-gray-100',
        'dark:bg-neutral-900',
        'dark:hover:bg-neutral-800',
        'text-gray-600',
        'dark:text-zinc-400',
      ])
    );
    expect(classList(repoCard)).toEqual(
      expect.arrayContaining([
        'bg-gray-50/50',
        'hover:bg-gray-100/80',
        'dark:bg-neutral-900/30',
        'dark:hover:bg-neutral-800/40',
      ])
    );
  });

  it('keeps real textual elements on semantic or high-contrast theme classes', () => {
    renderRepos('light');

    const title = screen.getByTestId('repo-header-title');
    const repoName = screen.getByText('popular-alpha');
    const description = screen.getByText('Alpha repository with premium themed card styling');
    const languageRow = screen.getAllByText('TypeScript')[0].closest('div');
    expect(languageRow).not.toBeNull();
    const metadata = languageRow!.parentElement;
    const dropdown = screen.getByRole('button', { name: /popular/i });

    expect(classList(title)).toEqual(expect.arrayContaining(['text-foreground']));
    expect(classList(repoName)).toEqual(
      expect.arrayContaining([
        'text-foreground',
        'group-hover:text-purple-600',
        'dark:group-hover:text-purple-400',
      ])
    );
    expect(classList(description)).toEqual(expect.arrayContaining(['text-muted-foreground']));
    expect(classList(metadata)).toEqual(expect.arrayContaining(['text-muted-foreground']));
    expect(classList(dropdown)).toEqual(
      expect.arrayContaining(['text-gray-600', 'dark:text-zinc-400'])
    );

    expect(contrastRatio(tokenHex.gray600, tokenHex.gray50)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(tokenHex.zinc400, tokenHex.neutral900)).toBeGreaterThanOrEqual(4.5);
  });

  it('activates selected and inactive dropdown option classes with passing contrast', () => {
    renderRepos('dark');

    fireEvent.click(screen.getByRole('button', { name: /popular/i }));
    const listbox = screen.getByRole('listbox');
    const popularOption = within(listbox).getByRole('option', { name: 'Popular' });
    const pinnedOption = within(listbox).getByRole('option', { name: 'Pinned' });

    expect(popularOption).toHaveAttribute('aria-selected', 'true');
    expect(classList(popularOption)).toEqual(
      expect.arrayContaining([
        'bg-purple-50',
        'dark:bg-purple-500/10',
        'text-purple-600',
        'dark:text-purple-400',
      ])
    );
    expect(classList(pinnedOption)).toEqual(
      expect.arrayContaining([
        'text-gray-700',
        'dark:text-zinc-300',
        'hover:bg-gray-50',
        'dark:hover:bg-neutral-800',
      ])
    );
    expect(screen.getByTestId('chevron-icon')).toHaveClass('rotate-180');

    expect(contrastRatio(tokenHex.purple600, tokenHex.purple50)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(tokenHex.purple400, tokenHex.neutral900)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(tokenHex.gray700, tokenHex.white)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(tokenHex.zinc300, tokenHex.neutral900)).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps layered backgrounds from clipping foreground repository content', () => {
    const { container } = renderRepos('dark');

    const panel = getRepoPanel();
    const repoCard = screen.getByRole('link', { name: /popular-alpha/i });
    const repoName = screen.getByText('popular-alpha');
    const languageDot = container.querySelector('span[style*="background-color"]') as HTMLElement;

    expect(classList(panel)).toEqual(expect.arrayContaining(['shadow-sm']));
    expect(classList(repoCard)).toEqual(
      expect.arrayContaining(['group', 'min-w-0', 'overflow-hidden'])
    );
    expect(classList(repoName)).toEqual(expect.arrayContaining(['truncate']));
    expect(languageDot.style.backgroundColor).toBe('rgb(49, 120, 198)');
    expect(repoCard).not.toHaveClass('text-transparent');
    expect(panel).not.toHaveClass('bg-transparent');
  });
});
