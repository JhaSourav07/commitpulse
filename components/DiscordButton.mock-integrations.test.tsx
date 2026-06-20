import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';

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
import { DiscordButton } from './DiscordButton';

vi.mock('gsap', () => ({
  default: {
    to: vi.fn(),
  },
}));

describe('DiscordButton - mock integrations', () => {
  it('renders integration link correctly', () => {
    render(<DiscordButton />);
    expect(screen.getByRole('link')).toBeInTheDocument();
  });

  it('displays integration CTA', () => {
    render(<DiscordButton />);
    expect(screen.getByText(/Join the core community on Discord/i)).toBeInTheDocument();
  });

  it('renders with integration svgs', () => {
    const { container } = render(<DiscordButton />);
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });

  it('targets external integration properly', () => {
    render(<DiscordButton />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('points to correct integration discord url', () => {
    render(<DiscordButton />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://discord.gg/Cb73bS79j');
  });
});
