/* eslint-disable @typescript-eslint/no-explicit-any */

/* eslint-disable @next/next/no-img-element */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ContributorsPage from './page';
import type { ReactNode, HTMLAttributes } from 'react';
import '@testing-library/jest-dom';

vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    const { fill, ...rest } = props as any;
    return <img {...rest} alt={props.alt || ''} />;
  },
}));

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({
    children,
    href,
    ...props
  }: { children: ReactNode; href: string } & HTMLAttributes<HTMLAnchorElement>) => (
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
    context: vi.fn((callback: () => void) => {
      if (typeof callback === 'function') {
        callback();
      }
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

vi.mock('framer-motion', () => {
  const cleanProps = (props: any) => {
    const {
      whileHover,
      whileInView,
      whileTap,
      whileDrag,
      layout,
      initial,
      animate,
      exit,
      transition,
      viewport,
      ...rest
    } = props;
    return rest;
  };

  return {
    motion: {
      div: ({ children, ...props }: any) => <div {...cleanProps(props)}>{children}</div>,
      span: ({ children, ...props }: any) => <span {...cleanProps(props)}>{children}</span>,
      p: ({ children, ...props }: any) => <p {...cleanProps(props)}>{children}</p>,
      h1: ({ children, ...props }: any) => <h1 {...cleanProps(props)}>{children}</h1>,
      h2: ({ children, ...props }: any) => <h2 {...cleanProps(props)}>{children}</h2>,
      h3: ({ children, ...props }: any) => <h3 {...cleanProps(props)}>{children}</h3>,
      h4: ({ children, ...props }: any) => <h4 {...cleanProps(props)}>{children}</h4>,
      h5: ({ children, ...props }: any) => <h5 {...cleanProps(props)}>{children}</h5>,
      h6: ({ children, ...props }: any) => <h6 {...cleanProps(props)}>{children}</h6>,
      section: ({ children, ...props }: any) => (
        <section {...cleanProps(props)}>{children}</section>
      ),
      a: ({ children, ...props }: any) => <a {...cleanProps(props)}>{children}</a>,
      button: ({ children, ...props }: any) => <button {...cleanProps(props)}>{children}</button>,
      img: (props: any) => <img alt="" {...cleanProps(props)} />,
    },
    AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
    useMotionValue: (initial: number) => ({ current: initial, set: vi.fn() }),
    useSpring: (value: { current: number }) => value,
    useTransform: (value: { current: number }, fn: (v: number) => number) => fn(value.current),
  };
});

describe('ContributorsPage - Responsive Breakpoints', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => [
          {
            id: 1,
            login: 'developer1',
            avatar_url: 'https://example.com/avatar.png',
            contributions: 42,
            html_url: 'https://github.com/developer1',
          },
        ],
      })
    ) as unknown as typeof fetch;

    window.HTMLElement.prototype.scrollIntoView = vi.fn();

    if (!window.requestAnimationFrame) {
      window.requestAnimationFrame = (callback: FrameRequestCallback) =>
        setTimeout(callback, 0) as unknown as number;
    }
  });

  it('verifies typography classes scaling across responsive viewports', async () => {
    const element = await ContributorsPage();
    render(element);

    const mainHeader = screen.getByRole('heading', { level: 1 });
    expect(mainHeader).toHaveClass('text-6xl');
    expect(mainHeader).toHaveClass('sm:text-7xl');
    expect(mainHeader).toHaveClass('md:text-8xl');
    expect(mainHeader).toHaveClass('lg:text-[10rem]');
  });

  it('verifies responsive column grids for layout containers', async () => {
    const element = await ContributorsPage();
    render(element);

    // Stats section should be 1 column on mobile and 3 columns on medium screens
    const statsContainer = screen
      .getByText('Global Architects')
      .closest('.stat-item')?.parentElement;
    expect(statsContainer).toHaveClass('grid-cols-1');
    expect(statsContainer).toHaveClass('md:grid-cols-3');
  });

  it('verifies flex layout wrapping rules adapt to screen size in CTA block', async () => {
    const element = await ContributorsPage();
    render(element);

    // CTA section buttons wrap on mobile (flex-col) and align horizontally on desktop (sm:flex-row)
    const buttonGroup = screen.getByText('View Repository').closest('div')?.parentElement;
    expect(buttonGroup).toHaveClass('flex-col');
    expect(buttonGroup).toHaveClass('sm:flex-row');
  });

  it('verifies mobile-only responsive display classes for decorative elements', async () => {
    const element = await ContributorsPage();
    render(element);

    // Custom cursor container should be hidden on mobile (hidden) and shown on desktop (md:block)
    const customCursor = document.querySelector('.mix-blend-difference');
    if (customCursor) {
      expect(customCursor).toHaveClass('hidden');
      expect(customCursor).toHaveClass('md:block');
    }
  });
});
