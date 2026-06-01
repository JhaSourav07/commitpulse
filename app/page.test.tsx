/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element, jsx-a11y/alt-text */
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import LandingPage from './page';

// Mock child components to isolate LandingPage testing
vi.mock('./components/CustomizeCTA', () => ({
  CustomizeCTA: () => <div data-testid="customize-cta">Customize CTA</div>,
}));

vi.mock('@/components/commitpulse-logo', () => ({
  CommitPulseLogo: () => <svg data-testid="commitpulse-logo"></svg>,
}));

vi.mock('@/components/WallOfLove', () => ({
  WallOfLove: () => <div data-testid="wall-of-love">Wall of Love</div>,
}));

vi.mock('@/components/DiscordButton', () => ({
  DiscordButton: () => <button data-testid="discord-button">Discord Button</button>,
}));

// next/image is no longer used — SVG preview is fetched via useEffect and
// rendered inline. The mock below keeps the import from erroring if any
// other test file still imports it.
vi.mock('next/image', () => ({
  default: (props: any) => <img {...props} />,
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props} data-testid="next-link">
      {children}
    </a>
  ),
}));

vi.mock('@/utils/tracking', () => ({
  trackUser: vi.fn(),
}));

// Mock GSAP so FeatureCards don't break in JSDOM
vi.mock('gsap', () => {
  const tween = { kill: vi.fn() };
  const timeline = {
    to: vi.fn().mockReturnThis(),
    fromTo: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    kill: vi.fn(),
  };
  return {
    default: {
      registerPlugin: vi.fn(),
      set: vi.fn(),
      to: vi.fn().mockReturnValue(tween),
      fromTo: vi.fn().mockReturnValue(tween),
      timeline: vi.fn().mockReturnValue(timeline),
      context: vi.fn((_fn: any) => ({ revert: vi.fn() })),
    },
  };
});

vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: {},
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      className,
      whileHover,
      whileTap,
      whileInView,
      initial,
      animate,
      exit,
      transition,
      viewport,
      layoutId,
      ...props
    }: any) => (
      <div className={className} data-testid="motion-div" {...props}>
        {children}
      </div>
    ),
    p: ({
      children,
      className,
      whileHover,
      whileTap,
      whileInView,
      initial,
      animate,
      exit,
      transition,
      viewport,
      layoutId,
      ...props
    }: any) => (
      <p className={className} data-testid="motion-p" {...props}>
        {children}
      </p>
    ),
    a: ({
      children,
      className,
      href,
      whileHover,
      whileTap,
      whileInView,
      initial,
      animate,
      exit,
      transition,
      viewport,
      layoutId,
      ...props
    }: any) => (
      <a href={href} className={className} data-testid="motion-a" {...props}>
        {children}
      </a>
    ),
    img: ({
      children,
      className,
      src,
      alt,
      onLoad,
      onError,
      initial,
      animate,
      exit,
      transition,
      ...props
    }: any) => (
      <img className={className} src={src} alt={alt} onLoad={onLoad} onError={onError} {...props} />
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const mockRecentSearches = {
  searches: ['octocat', 'torvalds'] as string[],
  addSearch: vi.fn(),
  clearSearches: vi.fn(),
  removeSearch: vi.fn(),
};

vi.mock('@/hooks/useRecentSearches', () => ({
  useRecentSearches: () => mockRecentSearches,
}));

describe('LandingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRecentSearches.searches = ['octocat', 'torvalds'];
    mockRecentSearches.addSearch = vi.fn();
    mockRecentSearches.clearSearches = vi.fn();
    mockRecentSearches.removeSearch = vi.fn();

    // Mock navigator.clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    // Mock scrollIntoView
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the main heading', () => {
    render(<LandingPage />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.textContent).toMatch(/Elevate Your/i);
    expect(heading.textContent).toMatch(/Contribution Story/i);
  });

  it('renders the input field empty by default', () => {
    render(<LandingPage />);
    const input = screen.getByPlaceholderText('Enter GitHub Username') as HTMLInputElement;
    expect(input).toBeDefined();
    expect(input.value).toBe('');
  });

  it('renders recent searches and applies a recent search when clicked', () => {
    render(<LandingPage />);
    const input = screen.getByPlaceholderText('Enter GitHub Username') as HTMLInputElement;
    const octocatButton = screen.getByRole('button', { name: 'octocat' });

    expect(octocatButton).toBeDefined();
    expect(screen.getByRole('button', { name: 'Clear' })).toBeDefined();

    fireEvent.click(octocatButton);

    expect(input.value).toBe('octocat');
  });

  it('renders an empty state before a username is entered', () => {
    render(<LandingPage />);

    expect(screen.getByText(/Enter a GitHub username above to instantly generate/i)).toBeDefined();
    // No badge img should be present yet
    expect(screen.queryByTestId('badge-img')).toBeNull();
  });

  it('updates the username when input changes and shows the badge img', async () => {
    render(<LandingPage />);
    const input = screen.getByPlaceholderText('Enter GitHub Username') as HTMLInputElement;

    await act(async () => {
      fireEvent.change(input, { target: { value: 'octocat' } });
    });
    expect(input.value).toBe('octocat');

    // The badge img element should appear in the DOM with the correct URL
    await waitFor(() => {
      const img = screen.getByTestId('badge-img') as HTMLImageElement;
      expect(img).toBeDefined();
      expect(img.src).toContain('user=octocat');
    });

    // Simulate the browser successfully loading the badge image
    await act(async () => {
      const img = screen.getByTestId('badge-img') as HTMLImageElement;
      fireEvent.load(img);
    });
  });

  it('disables the Watch Dashboard link when the username is empty', () => {
    render(<LandingPage />);
    const dashboardLink = screen.getByRole('link', { name: 'Watch Dashboard' });

    expect(dashboardLink.getAttribute('aria-disabled')).toBe('true');
    expect(dashboardLink.getAttribute('href')).toBe('/');
  });

  it('enables the Watch Dashboard link after a username is entered', () => {
    render(<LandingPage />);
    const input = screen.getByPlaceholderText('Enter GitHub Username') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'octocat' } });

    const dashboardLink = screen.getByRole('link', { name: 'Watch Dashboard' });
    expect(dashboardLink.getAttribute('aria-disabled')).not.toBe('true');
    expect(dashboardLink.getAttribute('href')).toBe('/dashboard/octocat');
  });

  it('handles copying to clipboard and showing the SuccessGuide', async () => {
    render(<LandingPage />);
    const input = screen.getByPlaceholderText('Enter GitHub Username') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'jhasourav07' } });

    const copyButton = screen.getByText('Copy Link').closest('button');
    fireEvent.click(copyButton!);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('/api/streak?user=jhasourav07')
    );

    await waitFor(() => {
      // The button text should change to Copied
      expect(screen.getByText('Copied')).toBeDefined();
      // The SuccessGuide should appear
      expect(screen.getByText('Your Monolith is Ready - Deploy It in 4 Steps')).toBeDefined();
    });
  });

  it('does not show copied state when clipboard write fails', async () => {
    vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(new Error('Permission denied'));

    render(<LandingPage />);
    const input = screen.getByPlaceholderText('Enter GitHub Username') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'jhasourav07' } });

    const copyButton = screen.getByText('Copy Link').closest('button');
    fireEvent.click(copyButton!);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('/api/streak?user=jhasourav07')
      );
    });

    expect(screen.queryByText('Copied')).toBeNull();
    expect(screen.queryByText('Your Monolith is Ready - Deploy It in 4 Steps')).toBeNull();
  });

  it('disables Copy Link button when username is empty', () => {
    render(<LandingPage />);

    const copyButton = screen.getByText('Copy Link').closest('button');

    expect(copyButton?.disabled).toBe(true);
  });

  it('does not copy link when username is empty', () => {
    render(<LandingPage />);

    const copyButton = screen.getByText('Copy Link').closest('button');

    fireEvent.click(copyButton!);

    expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
  });

  it('renders exactly 3 FeatureCards with correct titles', () => {
    render(<LandingPage />);

    const featureHeadings = screen.getAllByRole('heading', { level: 3 });

    expect(featureHeadings).toHaveLength(3);

    const titles = featureHeadings.map((h) => h.textContent);
    expect(titles).toEqual(['Real-time Sync', 'Theme Engine', 'Isometric Math']);
  });

  it('renders the CustomizeCTA', () => {
    render(<LandingPage />);
    expect(screen.getByTestId('customize-cta')).toBeDefined();
  });

  it('can dismiss the SuccessGuide', async () => {
    render(<LandingPage />);
    const input = screen.getByPlaceholderText('Enter GitHub Username') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'jhasourav07' } });

    // Trigger copy to show guide
    const copyButton = screen.getByText('Copy Link').closest('button');
    fireEvent.click(copyButton!);

    await waitFor(() => {
      expect(screen.getByText('Your Monolith is Ready - Deploy It in 4 Steps')).toBeDefined();
    });

    // Dismiss guide
    const dismissButton = screen.getByLabelText('Dismiss guide');
    fireEvent.click(dismissButton);

    await waitFor(() => {
      expect(screen.queryByText('Your Monolith is Ready - Deploy It in 4 Steps')).toBeNull();
    });
  });

  it('toggles the clear button X visibility and clears the input in username field on click', () => {
    render(<LandingPage />);
    const input = screen.getByPlaceholderText('Enter GitHub Username') as HTMLInputElement;

    expect(screen.queryByLabelText('Clear input')).toBeNull();

    fireEvent.change(input, { target: { value: 'a' } });
    const clearButton = screen.getByLabelText('Clear input');
    expect(clearButton).toBeDefined();

    fireEvent.click(clearButton);
    expect(input.value).toBe('');

    expect(screen.queryByLabelText('Clear input')).toBeNull();
  });

  it('renders recent searches and handles individual deletion', () => {
    mockRecentSearches.searches = ['octocat', 'jhasourav07'];
    render(<LandingPage />);

    expect(screen.getByText('octocat')).toBeDefined();
    expect(screen.getByText('jhasourav07')).toBeDefined();

    const deleteButtons = screen.getAllByLabelText(/Remove/);
    expect(deleteButtons.length).toBe(2);

    fireEvent.click(deleteButtons[0]);
    expect(mockRecentSearches.removeSearch).toHaveBeenCalledWith('octocat');

    // Cleanup
    mockRecentSearches.searches = [];
  });

  it('shows the friendly error UI instead of raw JSON when the API returns a 400', async () => {
    render(<LandingPage />);
    const input = screen.getByPlaceholderText('Enter GitHub Username') as HTMLInputElement;

    await act(async () => {
      fireEvent.change(input, { target: { value: 'invalid_user' } });
    });

    // Badge img renders; simulate the browser failing to load it (e.g. API returned 400)
    await waitFor(() => screen.getByTestId('badge-img'));
    await act(async () => {
      fireEvent.error(screen.getByTestId('badge-img'));
    });

    await waitFor(() => {
      expect(screen.getByText('GitHub user not found')).toBeDefined();
    });

    // The raw JSON error payload must never appear in the DOM
    expect(screen.queryByText(/Invalid parameters/)).toBeNull();
  });

  it('shows the friendly error UI for any non-ok API response (e.g. 429 rate limit)', async () => {
    render(<LandingPage />);
    const input = screen.getByPlaceholderText('Enter GitHub Username') as HTMLInputElement;

    await act(async () => {
      fireEvent.change(input, { target: { value: 'octocat' } });
    });

    // Simulate the browser failing to load the badge image
    await waitFor(() => screen.getByTestId('badge-img'));
    await act(async () => {
      fireEvent.error(screen.getByTestId('badge-img'));
    });

    await waitFor(() => {
      expect(screen.getByText('GitHub user not found')).toBeDefined();
    });

    expect(screen.queryByText(/Too Many Requests/)).toBeNull();
  });

  it('renders a badge img (not inline SVG) so XSS via SVG content is structurally impossible', async () => {
    // The new implementation uses <img src=URL> which the browser renders opaquely.
    // No SVG text is ever injected into the DOM, so no <script> tag can exist.
    render(<LandingPage />);

    const input = screen.getByPlaceholderText('Enter GitHub Username') as HTMLInputElement;

    await act(async () => {
      fireEvent.change(input, { target: { value: 'octocat' } });
    });

    // An <img> element with the API URL should appear (not inline SVG)
    await waitFor(() => {
      const img = screen.getByTestId('badge-img') as HTMLImageElement;
      expect(img).toBeDefined();
      expect(img.src).toContain('user=octocat');
    });

    // The SVG text is never injected into the DOM, so no <script> tag can exist
    expect(document.querySelector('script')).toBeNull();
  });
});
