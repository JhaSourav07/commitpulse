import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import RootLayout from './layout';
import AnimatedCursor from '@/components/AnimatedCursor';
import ReturnToTop from '@/components/ReturnToTop';
import KonamiEasterEgg from '@/components/KonamiEasterEgg';

vi.mock('next/font/google', () => ({
  Inter: () => ({ className: 'mocked-inter' }),
}));
vi.mock('@vercel/analytics/next', () => ({
  Analytics: () => <div data-testid="analytics" />,
}));
vi.mock('./components/navbar', () => ({
  default: () => <nav data-testid="navbar" />,
}));
vi.mock('@/components/BrandParticles', () => ({
  default: () => <div data-testid="brand-particles" />,
}));
vi.mock('@/components/ReturnToTop', () => ({
  default: () => <div data-testid="return-to-top" />,
}));
vi.mock('./components/ScrollRestoration', () => ({
  default: () => <div data-testid="scroll-restoration" />,
}));
vi.mock('./providers', () => ({
  Providers: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="providers">{children}</div>
  ),
}));
vi.mock('@/components/AnimatedCursor', () => ({
  default: () => <div data-testid="animated-cursor" />,
}));
vi.mock('@/components/KonamiEasterEgg', () => ({
  default: () => <div data-testid="konami" />,
}));

describe('Layout Mouse Interactivity & Touch Event Propagation', () => {
  const getLayoutElements = () => {
    const layout = RootLayout({ children: <div data-testid="content" /> }) as React.ReactElement<{
      children: React.ReactNode;
      [key: string]: unknown;
    }>;
    const htmlProps = layout.props;
    const body = React.Children.toArray(htmlProps.children)[1] as React.ReactElement<{
      children: React.ReactNode;
      className?: string;
    }>;
    const bodyChildren = React.Children.toArray(body.props.children);
    const providers = bodyChildren.find(
      (child) =>
        React.isValidElement(child) &&
        (child.props as { children?: React.ReactNode })?.children &&
        Array.isArray((child.props as { children?: React.ReactNode }).children)
    ) as React.ReactElement<{ children: React.ReactNode[] }>;
    const providerChildren = providers.props.children;

    return { layout, htmlProps, body, bodyChildren, providerChildren };
  };

  it('1. mounts the interactive cursor layer (AnimatedCursor) so hover/mouse-follow effects are active across the app', () => {
    const { providerChildren } = getLayoutElements();
    const cursor = providerChildren.find(
      (child) => React.isValidElement(child) && child.type === AnimatedCursor
    );
    expect(cursor).not.toBeUndefined();
  });

  it('2. positions main content relative so responsive tooltip layouts can display at computed coordinates', () => {
    const { providerChildren } = getLayoutElements();
    const mainContent = providerChildren.find(
      (child) => React.isValidElement(child) && child.type === 'main'
    ) as React.ReactElement<{ className?: string }>;

    expect(mainContent).not.toBeUndefined();
    expect(mainContent.props.className).toContain('relative');
  });

  it('3. keeps the skip link a real anchor so click and touch gestures propagate and navigate correctly', () => {
    const { bodyChildren } = getLayoutElements();
    const skipLink = bodyChildren.find(
      (child) => React.isValidElement(child) && child.type === 'a'
    ) as React.ReactElement<{ href?: string; className?: string }>;

    expect(skipLink).not.toBeUndefined();
    expect(skipLink.props.href).toBe('#main-content');
  });

  it('4. applies focus/hover reveal utility classes so the skip link is not permanently hidden from pointer interaction', () => {
    const { bodyChildren } = getLayoutElements();
    const skipLink = bodyChildren.find(
      (child) => React.isValidElement(child) && child.type === 'a'
    ) as React.ReactElement<{ className?: string }>;

    expect(skipLink.props.className).toContain('sr-only');
    expect(skipLink.props.className).toContain('focus:not-sr-only');
    expect(skipLink.props.className).toContain('focus:fixed');
  });

  it('5. mounts ReturnToTop and KonamiEasterEgg as overlay-capable components without blocking pointer events on main content', () => {
    const { providerChildren } = getLayoutElements();
    const mainContent = providerChildren.find(
      (child) => React.isValidElement(child) && child.type === 'main'
    ) as React.ReactElement<{ className?: string }>;
    const returnToTop = providerChildren.find(
      (child) => React.isValidElement(child) && child.type === ReturnToTop
    );
    const konami = providerChildren.find(
      (child) => React.isValidElement(child) && child.type === KonamiEasterEgg
    );

    expect(returnToTop).not.toBeUndefined();
    expect(konami).not.toBeUndefined();
    expect(mainContent.props.className).not.toContain('pointer-events-none');
  });
});
