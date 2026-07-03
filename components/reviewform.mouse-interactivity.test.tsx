import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ReactNode, HTMLAttributes, ButtonHTMLAttributes } from 'react';
import SubmitReviewPage from './reviewform';
import '@testing-library/jest-dom';

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

describe('reviewform mouse interactivity', () => {
  it('triggers simulated mouseenter and hover interactions', () => {
    render(<SubmitReviewPage />);

    const submitButton = screen.getByRole('button', {
      name: /share my testimonial/i,
    });

    fireEvent.mouseEnter(submitButton);
    fireEvent.mouseOver(submitButton);

    expect(submitButton).toBeInTheDocument();
  });

  it('keeps tooltip or interactive layout stable during hover events', () => {
    render(<SubmitReviewPage />);

    const twitterButton = screen.getByRole('button', {
      name: /twitter/i,
    });

    fireEvent.mouseEnter(twitterButton);

    expect(twitterButton).toHaveClass('flex-1');
  });

  it('propagates click and touch interactions correctly', () => {
    render(<SubmitReviewPage />);

    const githubButton = screen.getByRole('button', {
      name: /github/i,
    });

    fireEvent.click(githubButton);
    fireEvent.touchStart(githubButton);

    expect(githubButton).toBeInTheDocument();
  });

  it('applies interactive cursor and hover styling', () => {
    render(<SubmitReviewPage />);

    const submitButton = screen.getByRole('button', {
      name: /share my testimonial/i,
    });

    expect(submitButton.className).toContain('transition-all');
  });

  it('handles mouseleave without breaking the UI', () => {
    render(<SubmitReviewPage />);

    const submitButton = screen.getByRole('button', {
      name: /share my testimonial/i,
    });

    fireEvent.mouseLeave(submitButton);

    expect(screen.getByText('Loved CommitPulse?')).toBeInTheDocument();
  });
});
