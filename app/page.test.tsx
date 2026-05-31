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

    // Mock fetch so the SVG preview useEffect resolves without a real network call.
    // Returns a minimal valid SVG so dangerouslySetInnerHTML has something to render.
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: () =>
          Promise.resolve('<svg data-testid="badge-svg" xmlns="http://www.w3.org/2000/svg"></svg>'),
      })
    );

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
    expect(screen.getByText(/Elevate Your/i)).toBeDefined();
    expect(screen.getByText('Contribution')).toBeDefined();
    expect(screen.getByText(/Story/i)).toBeDefined();
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

  it('updates the username when input changes and fetches the badge', async () => {
    render(<LandingPage />);
    const input = screen.getByPlaceholderText('Enter GitHub Username') as HTMLInputElement;

    await act(async () => {
      fireEvent.change(input, { target: { value: 'octocat' } });
    });
    expect(input.value).toBe('octocat');

    // The component fetches the badge SVG from the API with the correct URL
    await waitFor(() => {
      expect(vi.mocked(fetch)).toHaveBeenCalledWith(
        expect.stringContaining('user=octocat'),
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      );
    });

    // After the fetch resolves the badge img element should be in the DOM
    await waitFor(() => {
      expect(screen.getByTestId('badge-img')).toBeDefined();
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
    // Username with an underscore passes the UI 39-char limit but fails the API regex,
    // which returns JSON {error: 'Invalid parameters'} with status 400. Without the fix
    // that JSON string would be rendered via dangerouslySetInnerHTML.
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: () => Promise.resolve(JSON.stringify({ error: 'Invalid parameters' })),
      })
    );

    render(<LandingPage />);
    const input = screen.getByPlaceholderText('Enter GitHub Username') as HTMLInputElement;

    await act(async () => {
      fireEvent.change(input, { target: { value: 'invalid_user' } });
    });

    await waitFor(() => {
      expect(screen.getByText('GitHub user not found')).toBeDefined();
    });

    // The raw JSON error payload must never appear in the DOM
    expect(screen.queryByText(/Invalid parameters/)).toBeNull();
  });

  it('shows the friendly error UI for any non-ok API response (e.g. 429 rate limit)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        text: () => Promise.resolve(JSON.stringify({ error: 'Too Many Requests' })),
      })
    );

    render(<LandingPage />);
    const input = screen.getByPlaceholderText('Enter GitHub Username') as HTMLInputElement;

    await act(async () => {
      fireEvent.change(input, { target: { value: 'octocat' } });
    });

    await waitFor(() => {
      expect(screen.getByText('GitHub user not found')).toBeDefined();
    });

    expect(screen.queryByText(/Too Many Requests/)).toBeNull();
  });

  it('renders a badge img (not inline SVG) so XSS via SVG content is structurally impossible', async () => {
    // The fetch mock returns an SVG with a <script> tag, but the new implementation
    // never injects SVG text into the DOM — it uses <img src=URL> which the browser
    // renders opaquely. No script tag should ever appear in the document.
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: () =>
          Promise.resolve(
            '<svg data-testid="badge-svg"><script>alert("xss")</script><circle /></svg>'
          ),
      })
    );

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
