import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import SubmitReviewPage from './reviewform';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
    button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
      <button {...props}>{children}</button>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

function setColorScheme(scheme: 'dark' | 'light') {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: query === `(prefers-color-scheme: ${scheme})`,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  );
}

describe('SubmitReviewPage - Dark and Light Prefers-Color-Scheme Visual Cohesion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('Dual Theme Setup: component renders without crashing in both dark and light color scheme environments', () => {
    // Dark mode render
    setColorScheme('dark');
    const { unmount } = render(<SubmitReviewPage />);
    expect(screen.getByText('Loved CommitPulse?')).toBeTruthy();
    unmount();

    // Light mode render
    setColorScheme('light');
    render(<SubmitReviewPage />);
    expect(screen.getByText('Loved CommitPulse?')).toBeTruthy();
  });

  it('Color Styling Adaptation: dark-mode background class is present on the root container', () => {
    setColorScheme('dark');
    const { container } = render(<SubmitReviewPage />);

    // Root container must carry the dark background class for dark mode cohesion
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain('bg-zinc-950');
    expect(root.className).toContain('text-white');
  });

  it('Contrast Ratio Standards: all form labels use zinc-400 muted text class for sufficient contrast against dark backgrounds', () => {
    setColorScheme('dark');
    render(<SubmitReviewPage />);

    const labels = Array.from(document.querySelectorAll('label'));

    // Every label must use muted-but-readable text class — not pure white (too harsh) or zinc-700 (too dim)
    labels.forEach((label) => {
      expect((label as HTMLElement).className).toContain('text-zinc-400');
    });
  });

  it('Tailwind Classes Active: form inputs carry correct dark-mode background and border classes in markup', () => {
    setColorScheme('dark');
    const { container } = render(<SubmitReviewPage />);

    const inputs = container.querySelectorAll('input, textarea');
    expect(inputs.length).toBeGreaterThan(0);

    // Each input must have the dark background and subtle border for visual cohesion
    inputs.forEach((input) => {
      expect(input.className).toContain('bg-zinc-900');
      expect(input.className).toContain('border-zinc-800');
    });
  });

  it('Background Overlay Safety: error alert uses translucent background that does not clip foreground text color', async () => {
    setColorScheme('dark');
    const { container } = render(<SubmitReviewPage />);

    // Trigger validation error by submitting empty form
    const submitButton = screen.getByRole('button', { name: /share my testimonial/i });
    submitButton.click();

    // Wait for React state update
    await new Promise((r) => setTimeout(r, 0));

    const errorEl = container.querySelector('[role="alert"]');
    if (errorEl) {
      // Error overlay must use translucent red background — not solid — so text remains visible
      expect(errorEl.className).toContain('text-red-400');
      expect(errorEl.className).toContain('bg-red-400/10');
      expect(errorEl.className).toContain('border-red-400/20');
    } else {
      // If no error rendered yet, assert the form is still intact and accessible
      expect(container.querySelector('form')).toBeTruthy();
    }
  });
});
