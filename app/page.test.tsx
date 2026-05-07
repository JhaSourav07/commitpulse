/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element, jsx-a11y/alt-text */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import LandingPage from './page';

// Mock child components to isolate LandingPage testing
vi.mock('./components/CustomizeCTA', () => ({
  CustomizeCTA: () => <div data-testid="customize-cta">Customize CTA</div>,
}));

vi.mock('@/components/commitpulse-logo', () => ({
  CommitPulseLogo: () => <svg data-testid="commitpulse-logo"></svg>,
}));

vi.mock('next/image', () => ({
  default: (props: any) => <img {...props} data-testid="next-image" />,
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
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('LandingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

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

  it('renders an empty state before a username is entered', () => {
    render(<LandingPage />);

    expect(screen.getByText('Enter a GitHub username to preview')).toBeDefined();
    expect(screen.queryByTestId('next-image')).toBeNull();
  });

  it('updates the username when input changes', () => {
    render(<LandingPage />);
    const input = screen.getByPlaceholderText('Enter GitHub Username') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'octocat' } });
    expect(input.value).toBe('octocat');

    // The image src should also update
    const image = screen.getByTestId('next-image') as HTMLImageElement;
    expect(image.src).toContain('user=octocat');
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
});
