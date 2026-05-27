/* eslint-disable @typescript-eslint/no-explicit-any */
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

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => (
      <div className={className} data-testid="motion-div" {...props}>
        {children}
      </div>
    ),
    p: ({ children, className, ...props }: any) => (
      <p className={className} data-testid="motion-p" {...props}>
        {children}
      </p>
    ),
    a: ({ children, className, href, ...props }: any) => (
      <a href={href} className={className} data-testid="motion-a" {...props}>
        {children}
      </a>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('@/hooks/useRecentSearches', () => ({
  useRecentSearches: () => ({
    searches: ['octocat', 'torvalds'],
    addSearch: vi.fn(),
    clearSearches: vi.fn(),
  }),
}));

describe('LandingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock fetch so the SVG preview useEffect resolves without a real network call.
    // Returns a minimal valid SVG so dangerouslySetInnerHTML has something to render.
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
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
    expect(screen.getByText(/Contribution Story/i)).toBeDefined();
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

    expect(screen.getByText('Enter a GitHub username to preview')).toBeDefined();
    // No SVG badge should be present yet
    expect(screen.queryByTestId('badge-svg')).toBeNull();
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

    // After the fetch resolves the inline SVG should be in the DOM
    await waitFor(() => {
      expect(screen.getByTestId('badge-svg')).toBeDefined();
    });
  });

  it('handles copying to clipboard and showing the SuccessGuide', async () => {
    render(<LandingPage />);
    const input = screen.getByPlaceholderText('Enter GitHub Username') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'jhasourav07' } });

    const copyButton = screen.getByText('Copy Link').closest('button');
    fireEvent.click(copyButton!);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining(
        '![CommitPulse](https://commitpulse.vercel.app/api/streak?user=jhasourav07)'
      )
    );

    await waitFor(() => {
      // The button text should change to Copied
      expect(screen.getByText('Copied')).toBeDefined();
      // The SuccessGuide should appear
      expect(screen.getByText('Your Monolith is Ready - Deploy It in 4 Steps')).toBeDefined();
    });
  });

  it('renders the FeatureCards', () => {
    render(<LandingPage />);
    expect(screen.getByText('Real-time Sync')).toBeDefined();
    expect(screen.getByText('Theme Engine')).toBeDefined();
    expect(screen.getByText('Isometric Math')).toBeDefined();
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
});
