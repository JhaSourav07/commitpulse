import { render, screen, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode, HTMLAttributes, ButtonHTMLAttributes } from 'react';
import '@testing-library/jest-dom';
import SubmitReviewPage from './reviewform';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) => (
      <div {...props}>{children}</div>
    ),
    button: ({
      children,
      ...props
    }: ButtonHTMLAttributes<HTMLButtonElement> & { children?: ReactNode }) => (
      <button {...props}>{children}</button>
    ),
  },
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

function setViewport(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  });
  window.dispatchEvent(new Event('resize'));
}

describe('SubmitReviewPage responsive breakpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the form correctly at a standard mobile viewport', () => {
    setViewport(375);

    render(<SubmitReviewPage />);

    expect(screen.getByRole('heading', { name: /loved commitpulse/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Handle (@username)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /share my testimonial/i })).toBeInTheDocument();
  });

  it('uses a single-column mobile layout for the name and handle fields', () => {
    const { container } = render(<SubmitReviewPage />);

    const responsiveGrid = Array.from(container.querySelectorAll('div')).find((element) => {
      const className = element.className;
      return (
        className.includes('grid-cols-1') &&
        className.includes('md:grid-cols-2') &&
        className.includes('gap-6')
      );
    });

    expect(responsiveGrid).toBeTruthy();
    expect(responsiveGrid?.className).toContain('grid-cols-1');
    expect(responsiveGrid?.className).toContain('md:grid-cols-2');
  });

  it('avoids fixed-width layout classes that would cause horizontal overflow', () => {
    const { container } = render(<SubmitReviewPage />);
    const markup = container.innerHTML;

    expect(screen.getByLabelText('Full Name')).toHaveClass('w-full');
    expect(screen.getByLabelText('Handle (@username)')).toHaveClass('w-full');
    expect(screen.getByPlaceholderText(/commitpulse completely transformed/i)).toHaveClass(
      'w-full'
    );
    expect(markup).not.toMatch(/class="[^"]*(w-\[[^\"]+]|min-w-\[[^\"]+])/);
  });

  it('scales the hero heading and secondary controls for smaller screens', () => {
    render(<SubmitReviewPage />);

    const heading = screen.getByRole('heading', { name: /loved commitpulse/i });
    expect(heading.className).toContain('text-5xl');
    expect(heading.className).toContain('md:text-6xl');
    expect(screen.getByRole('link', { name: /back to wall of love/i })).toHaveClass('inline-flex');
  });

  it('toggles the platform selector between Twitter and GitHub buttons', () => {
    render(<SubmitReviewPage />);

    const twitterButton = screen.getByRole('button', { name: /twitter/i });
    const githubButton = screen.getByRole('button', { name: /github/i });

    expect(twitterButton.className).toContain('border-[#1DA1F2]');
    expect(githubButton.className).toContain('border-zinc-800');

    fireEvent.click(githubButton);

    expect(githubButton.className).toContain('border-gray-400');
    expect(twitterButton.className).toContain('border-zinc-800');
  });
});
