import '@testing-library/jest-dom/vitest';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import ReturnToTop from './ReturnToTop';
import { useReducedMotion } from 'framer-motion';

vi.mock('lucide-react', async () => {
  const React = await import('react');

  return {
    ChevronUp: (props: React.SVGProps<SVGSVGElement>) => (
      <svg data-testid="chevron-up" {...props} />
    ),
  };
});

vi.mock('framer-motion', async () => {
  const React = await import('react');

  type MotionProps = {
    animate?: unknown;
    initial?: unknown;
    exit?: unknown;
    transition?: unknown;
    whileHover?: unknown;
    whileTap?: unknown;
    children?: React.ReactNode;
  };

  const MotionDiv = ({
    animate,
    initial,
    exit,
    transition,
    children,
    ...props
  }: React.HTMLAttributes<HTMLDivElement> & MotionProps) => {
    void animate;
    void initial;
    void exit;
    void transition;

    return <div {...props}>{children}</div>;
  };

  const MotionButton = ({
    whileHover,
    whileTap,
    animate,
    initial,
    exit,
    transition,
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & MotionProps) => {
    void whileHover;
    void whileTap;
    void animate;
    void initial;
    void exit;
    void transition;

    return <button {...props}>{children}</button>;
  };

  const MotionSpan = ({
    animate,
    transition,
    children,
    ...props
  }: React.HTMLAttributes<HTMLSpanElement> & MotionProps) => {
    void animate;
    void transition;

    return <span {...props}>{children}</span>;
  };

  const MotionCircle = ({
    animate,
    initial,
    exit,
    transition,
    whileHover,
    whileTap,
    children,
    ...props
  }: React.SVGProps<SVGCircleElement> & MotionProps) => {
    void animate;
    void initial;
    void exit;
    void transition;
    void whileHover;
    void whileTap;
    void children;

    return <circle {...props} />;
  };

  return {
    AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,

    motion: {
      div: MotionDiv,
      button: MotionButton,
      span: MotionSpan,
      circle: MotionCircle,
    },

    useReducedMotion: vi.fn(),

    useScroll: vi.fn(() => ({
      scrollYProgress: 0,
    })),

    useSpring: vi.fn(<T,>(value: T) => value),

    useTransform: vi.fn(() => 0),
  };
});

const MOBILE_VIEWPORT = {
  width: 375,
  height: 667,
};

const setScrollPosition = (scrollY: number) => {
  Object.defineProperty(window, 'scrollY', {
    writable: true,
    configurable: true,
    value: scrollY,
  });

  act(() => {
    window.dispatchEvent(new Event('scroll'));
  });
};

const setMobileViewport = () => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: MOBILE_VIEWPORT.width,
  });

  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: MOBILE_VIEWPORT.height,
  });
};

describe('ReturnToTop - Responsive Breakpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useReducedMotion).mockReturnValue(false);
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      writable: true,
      configurable: true,
      value: 3000,
    });
    setMobileViewport();
    setScrollPosition(0);
  });

  it('uses standard mobile media coordinates and edge-safe positioning', () => {
    render(<ReturnToTop />);

    setScrollPosition(350);

    const button = screen.getByRole('button', {
      name: /back to top/i,
    });

    expect(button.parentElement).not.toBeNull();

    const container = button.parentElement as HTMLElement;

    expect(container).toHaveClass('fixed');
    expect(container).toHaveClass('bottom-24');
    expect(container).toHaveClass('right-6');
    expect(container).toHaveClass('z-50');
    expect(window.innerWidth).toBe(MOBILE_VIEWPORT.width);
    expect(window.innerHeight).toBe(MOBILE_VIEWPORT.height);
  });

  it('renders a compact control suitable for mobile tap targets', () => {
    render(<ReturnToTop />);

    setScrollPosition(350);

    const button = screen.getByRole('button', {
      name: /back to top/i,
    });

    expect(button).toHaveClass('relative');
    expect(button).toHaveClass('flex');
    expect(button).toHaveClass('items-center');
    expect(button).toHaveClass('justify-center');
    expect(button).toHaveClass('h-14');
    expect(button).toHaveClass('w-14');
  });

  it('avoids absolute viewport widths that could create horizontal mobile scroll', () => {
    render(<ReturnToTop />);

    setScrollPosition(350);

    const button = screen.getByRole('button', {
      name: /back to top/i,
    });
    const container = button.parentElement as HTMLElement;
    const classNames = `${container.className} ${button.className}`;

    expect(classNames).not.toMatch(/\bw-screen\b/);
    expect(classNames).not.toMatch(/\bmin-w-screen\b/);
    expect(classNames).not.toMatch(/\bmax-w-none\b/);
    expect(classNames).not.toMatch(/\b(left|right|inset)-0\b/);
    expect(classNames).not.toMatch(/\bw-\[\d+(px|rem|vw)\]/);
    expect(classNames).not.toMatch(/\bmin-w-\[\d+(px|rem|vw)\]/);
  });

  it('scales navigation affordances down without clipping the progress indicator', () => {
    render(<ReturnToTop />);

    setScrollPosition(350);

    const button = screen.getByRole('button', {
      name: /back to top/i,
    });
    const progressSvg = button.querySelector('svg[viewBox="0 0 58 58"]');
    const icon = screen.getByTestId('chevron-up');

    expect(progressSvg).toBeInTheDocument();
    expect(progressSvg).toHaveAttribute('width', '58');
    expect(progressSvg).toHaveAttribute('height', '58');
    expect(progressSvg).toHaveClass('absolute');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('size', '23');
  });

  it('remains visible and correctly positioned after mobile scrolling', () => {
    render(<ReturnToTop />);

    expect(
      screen.queryByRole('button', {
        name: /back to top/i,
      })
    ).not.toBeInTheDocument();

    setScrollPosition(200);

    expect(
      screen.queryByRole('button', {
        name: /back to top/i,
      })
    ).not.toBeInTheDocument();

    setScrollPosition(400);

    const button = screen.getByRole('button', {
      name: /back to top/i,
    });

    expect(button).toBeInTheDocument();
    expect(button).toBeVisible();
    expect(button).toHaveClass(
      'relative',
      'flex',
      'items-center',
      'justify-center',
      'h-14',
      'w-14'
    );
    expect(button.parentElement).toHaveClass('fixed', 'bottom-24', 'right-6', 'z-50');
  });
});
