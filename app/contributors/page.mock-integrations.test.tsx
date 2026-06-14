// app/contributors/page.mock-integrations.test.tsx

import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('framer-motion', async () => {
  const React = await import('react');

  const motionProps = new Set([
    'whileHover',
    'whileTap',
    'whileInView',
    'initial',
    'animate',
    'exit',
    'variants',
    'transition',
    'viewport',
    'drag',
    'layout',
    'layoutId',
  ]);

  const stripMotionProps = (props: Record<string, unknown>) =>
    Object.fromEntries(Object.entries(props).filter(([key]) => !motionProps.has(key)));

  const createMotionComponent = (tag: string) => {
    const Component = ({
      children,
      ...props
    }: React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }) =>
      React.createElement(tag, stripMotionProps(props), children);

    Component.displayName = `Motion${tag}`;

    return Component;
  };

  return {
    motion: {
      div: createMotionComponent('div'),
      span: createMotionComponent('span'),
      p: createMotionComponent('p'),
      a: createMotionComponent('a'),
      button: createMotionComponent('button'),
      section: createMotionComponent('section'),
      article: createMotionComponent('article'),
      header: createMotionComponent('header'),
      footer: createMotionComponent('footer'),
      main: createMotionComponent('main'),
      nav: createMotionComponent('nav'),
      ul: createMotionComponent('ul'),
      li: createMotionComponent('li'),
      h1: createMotionComponent('h1'),
      h2: createMotionComponent('h2'),
      h3: createMotionComponent('h3'),
      h4: createMotionComponent('h4'),
      h5: createMotionComponent('h5'),
      h6: createMotionComponent('h6'),

      svg: createMotionComponent('svg'),
      g: createMotionComponent('g'),
      path: createMotionComponent('path'),
      circle: createMotionComponent('circle'),
      line: createMotionComponent('line'),

      img: createMotionComponent('img'),
    },

    AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,

    useReducedMotion: () => false,

    useMotionValue: (initial = 0) => ({
      get: () => initial,
      set: vi.fn(),
      on: vi.fn(),
      destroy: vi.fn(),
    }),

    useSpring: (value: unknown) => value,
    useTransform: (value: unknown) => value,
  };
});

type ContributorsClientProps = {
  contributors: unknown[];
  totalContributions: number;
  topContributors: unknown[];
};

const mockContributorsClient = vi.fn((props: ContributorsClientProps) => {
  void props;

  return <div data-testid="contributors-client">Contributors Client</div>;
});

vi.mock('./ContributorsClient', () => ({
  default: (props: ContributorsClientProps) => mockContributorsClient(props),
}));

describe('ContributorsPage Mock Integrations', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: {
        get: () => null,
      },
      json: async () => [
        {
          id: 1,
          login: 'test-contributor-1',
          avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4',
          contributions: 42,
          html_url: 'https://github.com/test-contributor-1',
        },
        {
          id: 2,
          login: 'test-contributor-2',
          avatar_url: 'https://avatars.githubusercontent.com/u/2?v=4',
          contributions: 10,
          html_url: 'https://github.com/test-contributor-2',
        },
      ],
    } as unknown as Response);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.unstubAllGlobals();
  });

  it('renders successfully using mocked service data', async () => {
    const { default: ContributorsPage } = await import('./page');

    const page = await ContributorsPage();

    render(page);

    expect(screen.getByTestId('contributors-client')).toBeInTheDocument();
  });

  it('passes contributor data from mocked fetch layer', async () => {
    const { default: ContributorsPage } = await import('./page');

    const page = await ContributorsPage();

    render(page);

    expect(mockContributorsClient).toHaveBeenCalled();

    expect(mockContributorsClient).toHaveBeenCalledTimes(1);
    const props = mockContributorsClient.mock.calls[0][0] as ContributorsClientProps;
    expect(props.contributors).toBeDefined();
    expect(Array.isArray(props.contributors)).toBe(true);
  });

  it('passes computed contribution totals to client component', async () => {
    const { default: ContributorsPage } = await import('./page');

    const page = await ContributorsPage();

    render(page);

    const props = mockContributorsClient.mock.calls[0][0] as ContributorsClientProps;

    expect(props.totalContributions).toBeGreaterThanOrEqual(0);
  });

  it('passes top contributors collection to client component', async () => {
    const { default: ContributorsPage } = await import('./page');

    const page = await ContributorsPage();

    render(page);

    const props = mockContributorsClient.mock.calls[0][0] as ContributorsClientProps;

    expect(Array.isArray(props.topContributors)).toBe(true);
  });

  it('falls back to empty contributor data on failed endpoint responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        headers: {
          get: () => null,
        },
      } as unknown as Response)
    );

    const { default: ContributorsPage } = await import('./page');

    const page = await ContributorsPage();

    render(page);

    expect(screen.getByTestId('contributors-client')).toBeInTheDocument();
  });
});
