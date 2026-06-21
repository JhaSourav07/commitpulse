/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element, jsx-a11y/alt-text */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ContributorsPage from './page';

vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    const { fill, ...rest } = props || {};
    return <img {...rest} />;
  },
}));

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
    img: 'img',
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useMotionValue: (initial: any) => ({ current: initial, set: vi.fn() }),
  useSpring: (value: any) => value,
  useTransform: (value: any, fn: any) => fn(value.current ?? value),
}));

describe('ContributorsPage empty fallback', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => [],
      })
    ) as any;

    window.HTMLElement.prototype.scrollIntoView = vi.fn();

    if (!window.requestAnimationFrame) {
      window.requestAnimationFrame = (callback: FrameRequestCallback) =>
        setTimeout(callback, 0) as unknown as number;
    }
  });

  it('renders fallback UI when contributors are empty', async () => {
    const element = await ContributorsPage();
    const { container } = render(element);

    expect(screen.getByText(/No architects found/i)).toBeTruthy();
    expect(container.textContent?.replace(/\s+/g, '')).toContain('0/0contributors');
    expect(screen.getByRole('heading', { name: /THE COLLECTIVE/i })).toBeTruthy();
    expect(screen.getByText(/READY TO BUILD\?/i)).toBeTruthy();
  });

  it('maintains page layout and empty markers for empty contributor input', async () => {
    const element = await ContributorsPage();
    render(element);

    expect(screen.getByRole('heading', { name: /THE VANGUARD/i })).toBeTruthy();
    expect(screen.getByRole('heading', { name: /THE COLLECTIVE/i })).toBeTruthy();
    expect(screen.getByText(/Explore The Elite/i)).toBeTruthy();
    expect(screen.queryByText(/View Profile/i)).toBeNull();
  });

  it('handles fetch failures gracefully and still renders fallback state', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('Network failure'))) as any;
    const element = await ContributorsPage();
    const { container } = render(element);

    expect(screen.getByText(/No architects found/i)).toBeTruthy();
    expect(container.textContent?.replace(/\s+/g, '')).toContain('0/0contributors');
  });

  it('handles non-ok API responses without breaking the page', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        headers: { get: vi.fn(() => null) },
        json: async () => [],
      })
    ) as any;

    const element = await ContributorsPage();
    const { container } = render(element);

    expect(screen.getByText(/No architects found/i)).toBeTruthy();
    expect(container.textContent?.replace(/\s+/g, '')).toContain('0/0contributors');
  });

  it('does not emit console errors when the fallback page renders', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const element = await ContributorsPage();
    render(element);

    expect(errorSpy).not.toHaveBeenCalled();
  });
});
