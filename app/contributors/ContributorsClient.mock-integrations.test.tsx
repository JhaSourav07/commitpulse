import React from 'react';
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ContributorsClient from './ContributorsClient';

type Contributor = {
  id: number;
  login: string;
  avatar_url: string;
  contributions: number;
  html_url: string;
};

const mockContributors: Contributor[] = [
  {
    id: 1,
    login: 'alice',
    avatar_url: 'https://example.com/alice.png',
    contributions: 42,
    html_url: 'https://github.com/alice',
  },
  {
    id: 2,
    login: 'bob',
    avatar_url: 'https://example.com/bob.png',
    contributions: 17,
    html_url: 'https://github.com/bob',
  },
  {
    id: 3,
    login: 'carol',
    avatar_url: 'https://example.com/carol.png',
    contributions: 9,
    html_url: 'https://github.com/carol',
  },
];

const scrollTriggers = vi.hoisted(() => [{ kill: vi.fn() }]);

vi.mock('gsap', () => ({
  default: {
    registerPlugin: vi.fn(),
    fromTo: vi.fn(),
    to: vi.fn(),
  },
}));

vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: {
    getAll: () => scrollTriggers,
  },
}));

vi.mock('next/image', () => ({
  default: ({
    alt,
    src,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & { width?: number; height?: number }) =>
    React.createElement('img', { alt, src, ...props }),
}));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('framer-motion', () => {
  const MotionDiv = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & {
      animate?: unknown;
      exit?: unknown;
      initial?: unknown;
      layout?: unknown;
      transition?: unknown;
      variants?: unknown;
    }
  >(({ animate, exit, initial, layout, transition, variants, children, style, ...props }, ref) => {
    void exit;
    void initial;
    void layout;
    void transition;
    void variants;

    const motionStyle =
      animate &&
      typeof animate === 'object' &&
      'x' in animate &&
      'y' in animate &&
      typeof animate.x === 'number' &&
      typeof animate.y === 'number'
        ? ({
            transform: `translate3d(${animate.x}px, ${animate.y}px, 0)`,
          } satisfies React.CSSProperties)
        : {};

    return (
      <div ref={ref} style={{ ...style, ...motionStyle }} {...props}>
        {children}
      </div>
    );
  });
  MotionDiv.displayName = 'MotionDiv';

  const MotionSpan = ({ children }: { children?: React.ReactNode }) => <span>{children}</span>;
  const MotionHeading = ({
    children,
    ...props
  }: React.HTMLAttributes<HTMLHeadingElement> & {
    animate?: unknown;
    initial?: unknown;
    transition?: unknown;
  }) => {
    const { animate, initial, transition, ...headingProps } = props;
    void animate;
    void initial;
    void transition;

    return <h1 {...headingProps}>{children}</h1>;
  };
  const MotionParagraph = ({
    children,
    ...props
  }: React.HTMLAttributes<HTMLParagraphElement> & {
    animate?: unknown;
    initial?: unknown;
    transition?: unknown;
  }) => {
    const { animate, initial, transition, ...paragraphProps } = props;
    void animate;
    void initial;
    void transition;

    return <p {...paragraphProps}>{children}</p>;
  };

  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: {
      div: MotionDiv,
      h1: MotionHeading,
      p: MotionParagraph,
      span: MotionSpan,
    },
    useMotionValue: () => ({ set: vi.fn() }),
    useSpring: (value: unknown) => value,
    useTransform: (_value: unknown, transform: (value: number) => number) => transform(0),
  };
});

const renderClient = () =>
  render(
    <ContributorsClient
      contributors={mockContributors}
      totalContributions={68}
      topContributors={mockContributors}
    />
  );

describe('ContributorsClient - Interactive Tooltips, Cursor Hovers & Touch Event Propagation', () => {
  const rafCallbacks: FrameRequestCallback[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
    rafCallbacks.length = 0;
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      rafCallbacks.push(callback);
      return rafCallbacks.length;
    });
  });

  it('renders successfully with mocked contributor data', () => {
    renderClient();

    expect(screen.getByRole('link', { name: /Explore The Elite/i })).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /View Repository/i })).toBeInTheDocument();

    expect(screen.getAllByText('alice')).toHaveLength(2);
  });
  it('renders all mocked contributors from the provided props', () => {
    renderClient();

    expect(screen.getAllByText('alice').length).toBeGreaterThan(0);
    expect(screen.getAllByText('bob').length).toBeGreaterThan(0);
    expect(screen.getAllByText('carol').length).toBeGreaterThan(0);
  });
  it('renders successfully when contributor lists are empty', () => {
    render(<ContributorsClient contributors={[]} totalContributions={0} topContributors={[]} />);

    expect(screen.getByRole('link', { name: /Explore The Elite/i })).toBeInTheDocument();
  });
  it('renders successfully with a large mocked contributor list', () => {
    const manyContributors = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      login: `user${i}`,
      avatar_url: '',
      contributions: i,
      html_url: `https://github.com/user${i}`,
    }));

    render(
      <ContributorsClient
        contributors={manyContributors}
        totalContributions={100}
        topContributors={manyContributors}
      />
    );

    expect(screen.getAllByText('user0')).toHaveLength(2);
  });
  it('updates the rendered contributors when mocked data changes', () => {
    const { rerender } = render(
      <ContributorsClient
        contributors={mockContributors}
        totalContributions={68}
        topContributors={mockContributors}
      />
    );

    const updatedContributors = [
      {
        id: 10,
        login: 'david',
        avatar_url: '',
        contributions: 55,
        html_url: 'https://github.com/david',
      },
    ];

    rerender(
      <ContributorsClient
        contributors={updatedContributors}
        totalContributions={55}
        topContributors={updatedContributors}
      />
    );

    expect(screen.getAllByText('david').length).toBeGreaterThan(0);
  });
});
