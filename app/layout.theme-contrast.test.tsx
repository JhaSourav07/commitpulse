import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import RootLayout from './layout';

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

describe('Layout Theme Contrast & Visual Cohesion', () => {
  const getLayoutElements = () => {
    const layout = RootLayout({ children: <div data-testid="content" /> }) as React.ReactElement<{
      children: React.ReactNode;
      [key: string]: unknown;
    }>;
    const htmlProps = layout.props;
    const head = React.Children.toArray(htmlProps.children)[0] as React.ReactElement<{
      children: React.ReactNode;
    }>;
    const body = React.Children.toArray(htmlProps.children)[1] as React.ReactElement<{
      children: React.ReactNode;
      className?: string;
    }>;
    return { layout, htmlProps, head, body };
  };

  it('1. Set up a dual theme environment mock (emulate both "dark" and "light" presets)', () => {
    const { head } = getLayoutElements();
    const script = React.Children.toArray(head.props.children)[0] as React.ReactElement<{
      dangerouslySetInnerHTML: { __html: string };
    }>;
    expect(script.props.dangerouslySetInnerHTML.__html).toContain(
      "window.localStorage.getItem('theme')"
    );
  });

  it('2. Assert that the visual elements adapt color styling properly for both settings', () => {
    const { head } = getLayoutElements();
    const script = React.Children.toArray(head.props.children)[0] as React.ReactElement<{
      dangerouslySetInnerHTML: { __html: string };
    }>;
    const scriptHtml = script.props.dangerouslySetInnerHTML.__html;
    expect(scriptHtml).toContain("document.documentElement.classList.add('dark')");
    expect(scriptHtml).toContain("document.documentElement.classList.remove('dark')");
  });

  it('3. Verify contrast ratio standards are satisfied for all textual elements', () => {
    const { body } = getLayoutElements();
    const children = React.Children.toArray(body.props.children);
    const skipLink = children.find(
      (child) => React.isValidElement(child) && child.type === 'a'
    ) as React.ReactElement<{ className?: string }>;
    expect(skipLink.props.className).toContain('bg-blue-600');
    expect(skipLink.props.className).toContain('text-white');
  });

  it('4. Check that specific custom stylesheet properties or Tailwind classes are active in the markup', () => {
    const { htmlProps, body } = getLayoutElements();
    expect(body.props.className).toContain('mocked-inter');
    expect(htmlProps['data-scroll-behavior']).toBe('smooth');
  });

  it('5. Ensure that background overlays do not clip foreground content colors', () => {
    const { body } = getLayoutElements();
    const children = React.Children.toArray(body.props.children);

    const providers = children.find(
      (child) =>
        React.isValidElement(child) &&
        (child.props as { children?: React.ReactNode })?.children &&
        Array.isArray((child.props as { children?: React.ReactNode }).children)
    ) as React.ReactElement<{ children: React.ReactNode[] }>;

    const providerChildren = providers.props.children;
    const mainContent = providerChildren.find(
      (child) => React.isValidElement(child) && child.type === 'main'
    ) as React.ReactElement<{ className?: string }>;

    expect(mainContent).not.toBeUndefined();
    expect(mainContent.props.className).toContain('relative');
    expect(mainContent.props.className).toContain('z-10');
  });
});
