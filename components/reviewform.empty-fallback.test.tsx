import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import SubmitReviewPage from './reviewform';

type MotionProps<T extends keyof React.JSX.IntrinsicElements> =
  React.ComponentPropsWithoutRef<T> & {
    initial?: unknown;
    animate?: unknown;
    whileHover?: unknown;
    whileTap?: unknown;
    transition?: unknown;
  };

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, initial, animate, transition, ...props }: MotionProps<'div'>) => (
      <div {...props}>{children}</div>
    ),
    button: ({ children, whileHover, whileTap, transition, ...props }: MotionProps<'button'>) => (
      <button {...props}>{children}</button>
    ),
  },
}));

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: React.ComponentPropsWithoutRef<'a'> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('ReviewForm Empty/Missing Inputs Verification', () => {
  it('renders the empty default form without runtime errors', () => {
    expect(() => render(<SubmitReviewPage />)).not.toThrow();

    expect(screen.getByRole('heading', { name: /loved commitpulse/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Alex Chen')).toHaveValue('');
    expect(screen.getByPlaceholderText('@alexcodes')).toHaveValue('');
    expect(screen.getByText('0/1000')).toBeInTheDocument();
  });

  it('shows a clear fallback validation message when name is missing', () => {
    render(<SubmitReviewPage />);

    const form = screen.getByRole('button', { name: /share my testimonial/i }).closest('form');
    expect(form).toBeInTheDocument();

    fireEvent.submit(form as HTMLFormElement);

    expect(screen.getByRole('alert')).toHaveTextContent(/please enter your full name/i);
  });

  it('shows a clear fallback validation message when handle is missing', async () => {
    const user = userEvent.setup();
    render(<SubmitReviewPage />);

    await user.type(screen.getByPlaceholderText('Alex Chen'), 'Vaibhav Kaushik');

    const form = screen.getByRole('button', { name: /share my testimonial/i }).closest('form');
    fireEvent.submit(form as HTMLFormElement);

    expect(screen.getByRole('alert')).toHaveTextContent(/please enter your handle/i);
  });

  it('shows a non-breaking fallback validation message for invalid handle input', async () => {
    const user = userEvent.setup();
    render(<SubmitReviewPage />);

    await user.type(screen.getByPlaceholderText('Alex Chen'), 'Vaibhav Kaushik');
    await user.type(screen.getByPlaceholderText('@alexcodes'), '@bad handle!');
    await user.type(
      screen.getByPlaceholderText(/commitpulse completely transformed/i),
      'CommitPulse helped improve my GitHub profile.'
    );

    const form = screen.getByRole('button', { name: /share my testimonial/i }).closest('form');
    fireEvent.submit(form as HTMLFormElement);

    expect(screen.getByRole('alert')).toHaveTextContent(/handle must be a valid username/i);
  });

  it('maintains empty-state DOM structure and default styling markers', () => {
    const { container } = render(<SubmitReviewPage />);

    expect(container.firstElementChild).toHaveClass('min-h-screen', 'bg-zinc-950', 'text-white');
    expect(screen.getByRole('link', { name: /back to wall of love/i })).toHaveAttribute(
      'href',
      '/'
    );
    expect(screen.getByRole('button', { name: /twitter \/ x/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /github/i })).toBeInTheDocument();
    expect(container.querySelectorAll('button[style*="background-color"]')).toHaveLength(8);
  });
});
