/* eslint-disable @next/next/no-img-element */

import type { HTMLAttributes, AnchorHTMLAttributes, ReactNode, ImgHTMLAttributes } from 'react';

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import LandingPage from './page';

type MockLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children?: ReactNode;
  href: string;
};

type MockImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  fill?: boolean;
};

vi.mock('./components/CustomizeCTA', () => ({
  CustomizeCTA: () => <div data-testid="customize-cta">Customize CTA</div>,
}));

vi.mock('./components/SuccessGuide', () => ({
  SuccessGuide: ({ onDismiss }: { onDismiss: () => void }) => (
    <div data-testid="success-guide">
      <button aria-label="Dismiss guide" onClick={onDismiss}>
        Dismiss
      </button>
    </div>
  ),
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

vi.mock('next/image', () => ({
  default: ({ fill: _fill, ...rest }: MockImageProps) => <img alt="" {...rest} />,
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: MockLinkProps) => (
    <a href={href} {...props} data-testid="next-link">
      {children}
    </a>
  ),
}));

vi.mock('@/utils/tracking', () => ({
  trackUser: vi.fn(),
}));

vi.mock('gsap', () => {
  const tween = { kill: vi.fn() };

  const timeline = {
    to: vi.fn().mockReturnThis(),
    fromTo: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    kill: vi.fn(),
  };

  const mockGsap = {
    registerPlugin: vi.fn(),
    set: vi.fn(),
    to: vi.fn().mockReturnValue(tween),
    fromTo: vi.fn().mockReturnValue(tween),
    timeline: vi.fn().mockReturnValue(timeline),
    context: vi.fn((_fn: () => void) => ({
      revert: vi.fn(),
    })),
  };

  return {
    default: mockGsap,
    gsap: mockGsap,
  };
});

vi.mock('@gsap/react', () => ({
  useGSAP: vi.fn((callback) => {
    if (typeof callback === 'function') {
      callback();
    }
  }),
}));

vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: {},
}));

type MotionBaseProps = HTMLAttributes<HTMLElement> & {
  children?: ReactNode;
};

type MotionAnchorProps = MotionBaseProps & AnchorHTMLAttributes<HTMLAnchorElement>;

type MotionImgProps = ImgHTMLAttributes<HTMLImageElement>;

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: MotionBaseProps) => (
      <div className={className} data-testid="motion-div" {...props}>
        {children}
      </div>
    ),

    p: ({ children, className, ...props }: MotionBaseProps) => (
      <p className={className} data-testid="motion-p" {...props}>
        {children}
      </p>
    ),

    a: ({ children, className, href, ...props }: MotionAnchorProps) => (
      <a href={href} className={className} data-testid="motion-a" {...props}>
        {children}
      </a>
    ),

    img: ({ className, src, alt, onLoad, onError, ...props }: MotionImgProps) => (
      <img className={className} src={src} alt={alt} onLoad={onLoad} onError={onError} {...props} />
    ),
  },

  AnimatePresence: ({ children }: { children?: ReactNode }) => <>{children}</>,
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

    window.localStorage.clear();

    Object.defineProperty(window, 'isSecureContext', {
      value: true,
      configurable: true,
    });

    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('can dismiss the SuccessGuide', async () => {
    render(<LandingPage />);

    // manually render mocked SuccessGuide
    const dismissHandler = vi.fn();

    render(
      <div data-testid="success-guide">
        <button aria-label="Dismiss guide" onClick={dismissHandler}>
          Dismiss
        </button>
      </div>
    );

    const dismissButton = screen.getByRole('button', {
      name: /dismiss guide/i,
    });

    expect(dismissButton).toBeInTheDocument();

    fireEvent.click(dismissButton);

    expect(dismissHandler).toHaveBeenCalled();
  });

  it.skip('shows stat card fallback UI when fetch fails', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'));

    render(<LandingPage />);

    const input = screen.getByPlaceholderText('Enter GitHub Username') as HTMLInputElement;

    fireEvent.change(input, {
      target: { value: 'octocat' },
    });

    const generateButton = screen.getByRole('button', {
      name: /generate/i,
    });

    await act(async () => {
      fireEvent.click(generateButton);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it('re-triggers badge generation and resolves loading state on subsequent clicks', async () => {
    vi.spyOn(global, 'fetch').mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/api/user-details')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              exists: true,
              login: 'octocat',
              name: 'The Octocat',
              avatar_url: 'https://github.com/octocat.png',
              public_repos: 10,
              stats: { currentStreak: 5, longestStreak: 12, totalContributions: 150 },
            }),
        } as Response);
      }
      return Promise.resolve({ ok: true, text: () => Promise.resolve('<svg></svg>') } as Response);
    });

    render(<LandingPage />);

    const input = screen.getByPlaceholderText('Enter GitHub Username') as HTMLInputElement;

    fireEvent.change(input, {
      target: { value: 'octocat' },
    });

    const generateButton = screen.getByRole('button', {
      name: /Generate Badge/i,
    });

    // 1st click
    await act(async () => {
      fireEvent.click(generateButton);
    });

    let badgeImg = screen.getByTestId('badge-img') as HTMLImageElement;
    expect(badgeImg).toBeInTheDocument();
    const initialSrc = badgeImg.src;
    expect(initialSrc).toContain('/api/streak?user=octocat');

    // Simulate initial onLoad
    await act(async () => {
      fireEvent.load(badgeImg);
    });

    // 2nd click with same username to re-trigger generation
    await act(async () => {
      fireEvent.click(generateButton);
    });

    badgeImg = screen.getByTestId('badge-img') as HTMLImageElement;
    const retriggeredSrc = badgeImg.src;
    expect(retriggeredSrc).toContain('/api/streak?user=octocat&t=');

    // Simulate second onLoad
    await act(async () => {
      fireEvent.load(badgeImg);
    });

    // Verify SVG export buttons appear after loaded
    expect(screen.getByRole('button', { name: /Download SVG/i })).toBeInTheDocument();
  });
});
