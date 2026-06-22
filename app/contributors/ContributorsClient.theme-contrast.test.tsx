/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ContributorsClient from './ContributorsClient';

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('gsap', () => {
  const tween = { kill: vi.fn() };

  const mockGsap = {
    registerPlugin: vi.fn(),
    to: vi.fn().mockReturnValue(tween),
    fromTo: vi.fn().mockReturnValue(tween),
    set: vi.fn(),
    context: vi.fn((callback: any) => {
      if (typeof callback === 'function') callback();
      return { revert: vi.fn() };
    }),
  };

  return { default: mockGsap, gsap: mockGsap };
});

vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: {
    getAll: vi.fn(() => []),
  },
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    span: 'span',
    p: 'p',
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
    h4: 'h4',
    h5: 'h5',
    h6: 'h6',
    section: 'section',
    a: 'a',
    button: 'button',
  },
  useMotionValue: (initial: any) => ({
    current: initial,
    set: vi.fn(),
  }),
  useSpring: (value: any) => value,
  useTransform: (value: any, fn: any) => fn(value.current ?? value),
}));

vi.mock('./ContributorsSearch', () => ({
  default: () => <div>Mock Contributors Search</div>,
}));

vi.mock('@/components/Leaderboard', () => ({
  default: () => <div>Mock Leaderboard</div>,
}));

vi.mock('@/app/components/Footer', () => ({
  Footer: () => <footer>Mock Footer</footer>,
}));

function hasClasses(element: Element | null, classes: string[]) {
  expect(element).not.toBeNull();

  for (const className of classes) {
    expect(element!.className).toContain(className);
  }
}

const contributors = [
  {
    id: 1,
    login: 'navya',
    avatar_url: 'avatar.png',
    contributions: 42,
    html_url: 'https://github.com/navya',
  },
];

describe('ContributorsClient theme contrast', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    if (!window.requestAnimationFrame) {
      window.requestAnimationFrame = (callback: FrameRequestCallback) =>
        setTimeout(callback, 0) as unknown as number;
    }
  });

  it('applies root light and dark theme classes', () => {
    const { container } = render(
      <ContributorsClient
        contributors={contributors}
        totalContributions={42}
        topContributors={contributors}
      />
    );

    const root = container.firstElementChild;

    hasClasses(root, [
      'bg-white',
      'dark:bg-[#050505]',
      'text-black',
      'dark:text-white',
      'overflow-hidden',
    ]);
  });

  it('renders hero badge with theme-aware contrast classes', () => {
    render(
      <ContributorsClient
        contributors={contributors}
        totalContributions={42}
        topContributors={contributors}
      />
    );

    const badge = screen.getByText(/The Architect Collective/i).parentElement;

    hasClasses(badge, ['border-black/10', 'dark:border-white/10', 'bg-black/5', 'dark:bg-white/5']);
  });

  it('renders statistic cards with dark and light contrast styling', () => {
    render(
      <ContributorsClient
        contributors={contributors}
        totalContributions={42}
        topContributors={contributors}
      />
    );

    const label = screen.getByText(/Global Architects/i);
    const statCard = label.closest('.stat-item');

    hasClasses(statCard, [
      'border-black/10',
      'dark:border-white/10',
      'bg-black/[0.02]',
      'dark:bg-white/[0.02]',
    ]);
  });

  it('renders CTA buttons with readable foreground and background contrast', () => {
    render(
      <ContributorsClient
        contributors={contributors}
        totalContributions={42}
        topContributors={contributors}
      />
    );

    const repositoryButton = screen.getByRole('link', {
      name: /View Repository/i,
    });

    hasClasses(repositoryButton, ['bg-black', 'dark:bg-white', 'text-white', 'dark:text-black']);
  });

  it('keeps foreground content above visual overlays without clipping', () => {
    const { container } = render(
      <ContributorsClient
        contributors={contributors}
        totalContributions={42}
        topContributors={contributors}
      />
    );

    const overlayLayer = container.querySelector('.z-0');
    const contentLayer = container.querySelector('.z-10');

    expect(overlayLayer).not.toBeNull();
    expect(contentLayer).not.toBeNull();

    expect(contentLayer!.className).toContain('z-10');
    expect(overlayLayer!.className).toContain('z-0');
  });
});
