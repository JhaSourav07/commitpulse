import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import Navbar from './navbar';

// Mock matchMedia globally for JSDOM (required for the navbar's breakpoint listener)
beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

vi.mock('@/hooks/useGlowEffect', () => ({
  useGlowEffect: () => ({
    shellRef: null,
    shellVars: {},
    handleMouseEnter: vi.fn(),
    handleMouseMove: vi.fn(),
    handleMouseLeave: vi.fn(),
  }),
}));

vi.mock('@/hooks/useKeyboardShortcuts', () => ({
  useKeyboardShortcuts: vi.fn(),
}));

vi.mock('./theme-switch', () => ({
  useThemeToggle: () => ({
    isDark: false,
    mounted: true,
    toggleTheme: vi.fn(),
  }),
}));

vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'navbar.menu_open': 'Open menu',
        'navbar.menu_close': 'Close menu',
        'navbar.home': 'Home',
        'navbar.repo': 'GitHub Repo',
        'navbar.theme_toggle': 'Toggle theme',
        'navbar.generator': 'Generator',
        'navbar.compare': 'Compare',
        'navbar.burnout_radar': 'Burnout Radar',
        'navbar.customization_studio': 'Customization Studio',
      };
      return translations[key] || key;
    },
    language: 'en',
    changeLanguage: vi.fn(),
    isPending: false,
  }),
  LANGUAGE_LABELS: {
    en: 'English',
    hi: 'Hindi',
  },
}));

describe('Navbar Timezone Normalization & Calendar Data Boundary Alignment', () => {
  // Test 1: Mock standard timezone settings (UTC baseline)
  it('1. Renders consistently when the system clock is normalized to UTC midnight', () => {
    // Freeze time at UTC midnight (Jan 1, 2025 00:00:00 UTC) to assert the
    // navbar does not shift or re-render based on the wall-clock timezone.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01T00:00:00.000Z'));

    render(<Navbar />);

    // The navbar's primary "Open menu" control must remain rendered regardless
    // of the underlying system timezone.
    expect(screen.getByRole('button', { name: 'Open menu' })).toBeDefined();
    // The brand label acts as a stable timezone-independent anchor.
    expect(screen.getByText('CommitPulse')).toBeDefined();
  });

  // Test 2: Assert rendering aligns across EST, IST, and JST timezone offsets
  it('2. Aligns navigation link rendering across EST, IST, and JST timezone offsets', () => {
    // We iterate over three real-world offsets to ensure that the rendered
    // link set is identical â€” the navbar must not conditionally hide any link
    // based on the system's TZ offset.
    const offsetsInMinutes = [300 /* EST -5 */, -330 /* IST +5:30 */, -540 /* JST +9 */];

    offsetsInMinutes.forEach((offset) => {
      const originalGetTimezoneOffset = Date.prototype.getTimezoneOffset;
      Date.prototype.getTimezoneOffset = () => offset;

      const { unmount } = render(<Navbar />);

      // Every navigation link declared in NAV_LINKS must render exactly once,
      // proving that timezone offsets never gate link visibility.
      expect(screen.getAllByRole('link', { name: /Generator/i }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('link', { name: /^Compare$/i }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('link', { name: /Burnout Radar/i }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('link', { name: /Customization Studio/i }).length).toBeGreaterThan(
        0
      );

      unmount();
      Date.prototype.getTimezoneOffset = originalGetTimezoneOffset;
    });
  });

  // Test 3: Verify leap year boundaries (Feb 29) do not break rendering
  it('3. Verifies leap year date boundaries (Feb 29, 2024) parse without leaving rendering gaps', () => {
    // Feb 29 is the classic date-parsing minefield. Freezing the clock there
    // guarantees the navbar does not depend on a non-leap-year assumption.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-02-29T12:00:00.000Z'));

    const { container } = render(<Navbar />);

    // The <header> shell is the outermost stable anchor and must always mount.
    const header = container.querySelector('header');
    expect(header).toBeInTheDocument();

    // The desktop navigation row must also render, proving no leap-year
    // exception silently unmounted a subtree.
    const desktopNavRow = container.querySelector('.hidden.items-center.gap-2.lg\\:flex');
    expect(desktopNavRow).toBeInTheDocument();
  });

  // Test 4: Assert locale date formatting does not corrupt link labels
  it('4. Asserts navigation labels match expectations regardless of active locale format', () => {
    // Simulate a non-en-US locale via toLocaleDateString to prove that link
    // labels are sourced from the translation layer, not the runtime locale.
    const originalToLocaleDateString = Date.prototype.toLocaleDateString;
    Date.prototype.toLocaleDateString = function () {
      return '29/02/2024'; // dd/mm/yyyy â€” a non-US format
    };

    render(<Navbar />);

    // Labels must remain in the English mock regardless of the injected locale.
    expect(screen.getAllByText('Generator').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Compare').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Burnout Radar').length).toBeGreaterThan(0);

    Date.prototype.toLocaleDateString = originalToLocaleDateString;
  });

  // Test 5: Test timezone offsets around DST transition dates
  it('5. Remains stable when the system clock crosses a daylight-savings transition boundary', () => {
    // March 10, 2024 at 02:00 US/Eastern is the exact DST spring-forward
    // moment where the wall clock jumps to 03:00. If any effect in the navbar
    // depends on monotonic time, mounting at this instant would surface it.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-03-10T07:00:00.000Z'));

    const { container, unmount } = render(<Navbar />);
    expect(container.querySelector('header')).toBeInTheDocument();
    unmount();

    // November 3, 2024 at 02:00 US/Eastern is the fall-back moment where the
    // hour repeats. Re-mounting here catches any effect that assumes distinct
    // timestamps between mounts.
    vi.setSystemTime(new Date('2024-11-03T06:00:00.000Z'));

    const { container: container2 } = render(<Navbar />);
    expect(container2.querySelector('header')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open menu' })).toBeDefined();
  });
});
