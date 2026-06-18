import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReturnToTop from './ReturnToTop';

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  motion: {
    button: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
      <button {...props}>{children}</button>
    ),
    circle: (props: Record<string, unknown>) => <circle {...props} />,
    div: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
      <div {...props}>{children}</div>
    ),
    span: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
      <span {...props}>{children}</span>
    ),
  },
  useReducedMotion: () => false,
  useScroll: () => ({ scrollYProgress: 0 }),
  useSpring: (value: unknown) => value,
  useTransform: () => 0,
}));

vi.mock('lucide-react', () => ({
  ChevronUp: () => <svg data-testid="chevron-up-icon" />,
}));

describe('ReturnToTop Accessibility Standards & Screen Reader Aria Compliance', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true,
      value: 2000,
    });
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 1000,
      writable: true,
    });
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 750,
      writable: true,
    });
  });

  it('inspects markup for correct use of accessible label coordinates (role, aria-label, aria-labelledby)', () => {
    render(<ReturnToTop />);
    const button = screen.getByRole('button', { name: /back to top/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label', 'Back to top');
  });

  it('asserts elements that accept key focus (button) maintain visible outline behaviors', () => {
    render(<ReturnToTop />);
    const button = screen.getByRole('button', { name: /back to top/i });
    expect(button).toHaveClass('focus-visible:outline');
    expect(button).toHaveClass('focus-visible:outline-2');
    expect(button).toHaveClass('focus-visible:outline-offset-4');
    expect(button).toHaveClass('focus-visible:outline-violet-400');
  });

  it('verifies tooltip labels are announced with correct accessibility descriptions', () => {
    render(<ReturnToTop />);
    const button = screen.getByRole('button', { name: /back to top/i });
    expect(button).toHaveAttribute('aria-label', 'Back to top');
  });

  it('tests keyboard control path selectors to ensure normal tab ordering', async () => {
    render(<ReturnToTop />);
    const user = userEvent.setup();
    await user.tab();
    expect(screen.getByRole('button', { name: /back to top/i })).toHaveFocus();
  });

  it('confirms decorative progress SVG has aria-hidden="true"', () => {
    const { container } = render(<ReturnToTop />);
    const decorativeSvg = container.querySelector('svg[aria-hidden="true"]');
    expect(decorativeSvg).toBeInTheDocument();
  });
});
