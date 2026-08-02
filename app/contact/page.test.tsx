import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import ContactPage from './page';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
  motion: {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    div: ({
      children,
      initial,
      animate,
      exit,
      transition,
      variants,
      whileInView,
      viewport,
      ...props
    }: React.HTMLAttributes<HTMLDivElement> & Record<string, unknown>) => (
      <div {...props}>{children}</div>
    ),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    form: ({
      children,
      onSubmit,
      initial,
      animate,
      exit,
      transition,
      ...props
    }: React.FormHTMLAttributes<HTMLFormElement> & Record<string, unknown>) => (
      <form onSubmit={onSubmit} {...props}>
        {children}
      </form>
    ),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    p: ({
      children,
      initial,
      animate,
      exit,
      transition,
      ...props
    }: React.HTMLAttributes<HTMLParagraphElement> & Record<string, unknown>) => (
      <p {...props}>{children}</p>
    ),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    button: ({
      children,
      whileTap,
      whileHover,
      initial,
      animate,
      exit,
      transition,
      ...props
    }: React.ButtonHTMLAttributes<HTMLButtonElement> & Record<string, unknown>) => (
      <button {...props}>{children}</button>
    ),
  },
}));

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & {
    children?: ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ContactPage', () => {
  it('renders without crashing', () => {
    render(<ContactPage />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('renders the hero heading', () => {
    render(<ContactPage />);
    expect(screen.getByText(/conversation/i)).toBeInTheDocument();
  });

  it('renders all required form fields', () => {
    render(<ContactPage />);
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/subject/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
  });

  it('marks required fields with aria-required', () => {
    render(<ContactPage />);
    expect(screen.getByLabelText(/full name/i)).toHaveAttribute('aria-required', 'true');
    expect(screen.getByLabelText(/email address/i)).toHaveAttribute('aria-required', 'true');
    expect(screen.getByLabelText(/subject/i)).toHaveAttribute('aria-required', 'true');
    expect(screen.getByLabelText(/message/i)).toHaveAttribute('aria-required', 'true');
  });

  it('shows validation errors when submitting an empty form', async () => {
    render(<ContactPage />);
    const submitButton = screen.getByRole('button', { name: /send message/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/full name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/email address is required/i)).toBeInTheDocument();
      expect(screen.getByText(/subject is required/i)).toBeInTheDocument();
      expect(screen.getByText(/message is required/i)).toBeInTheDocument();
    });
  });

  it('shows an email format error for an invalid email', async () => {
    render(<ContactPage />);
    const emailInput = screen.getByLabelText(/email address/i);
    await userEvent.type(emailInput, 'not-an-email');
    fireEvent.blur(emailInput);

    await waitFor(() => {
      expect(screen.getByText(/valid email address/i)).toBeInTheDocument();
    });
  });

  it('shows a name length error for a single-character name', async () => {
    render(<ContactPage />);
    const nameInput = screen.getByLabelText(/full name/i);
    await userEvent.type(nameInput, 'A');
    fireEvent.blur(nameInput);

    await waitFor(() => {
      expect(screen.getByText(/at least 2 characters/i)).toBeInTheDocument();
    });
  });

  it('shows a message length error for a short message', async () => {
    render(<ContactPage />);
    const messageInput = screen.getByLabelText(/message/i);
    await userEvent.type(messageInput, 'hi');
    fireEvent.blur(messageInput);

    await waitFor(() => {
      expect(screen.getByText(/at least 10 characters/i)).toBeInTheDocument();
    });
  });

  it('clears a field error once the user provides a valid value', async () => {
    render(<ContactPage />);

    // Use getByRole to avoid ambiguity with aria-describedby matches
    const emailInput = screen.getByRole('textbox', { name: /email address/i });

    await userEvent.type(emailInput, 'bad');
    fireEvent.blur(emailInput);

    await waitFor(() => {
      expect(screen.getByText(/valid email address/i)).toBeInTheDocument();
    });

    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, 'good@example.com');
    fireEvent.blur(emailInput);

    await waitFor(() => {
      expect(screen.queryByText(/valid email address/i)).not.toBeInTheDocument();
    });
  });

  it('renders the "Back to Home" link pointing to "/"', () => {
    render(<ContactPage />);
    const backLink = screen.getByRole('link', { name: /back to home/i });
    expect(backLink).toHaveAttribute('href', '/');
  });

  it('renders all four social media links', () => {
    render(<ContactPage />);
    // The page renders social platform links (button row + info card),
    // so some platforms may appear more than once — use getAllByRole.
    expect(screen.getAllByRole('link', { name: /github/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole('link', { name: /discord/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole('link', { name: /twitter/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole('link', { name: /linkedin/i }).length).toBeGreaterThanOrEqual(1);
  });

  it('renders the support email link', () => {
    render(<ContactPage />);
    const emailLink = screen.getByRole('link', {
      name: /support@commitpulse.dev/i,
    });
    expect(emailLink).toHaveAttribute('href', 'mailto:support@commitpulse.dev');
  });

  it('shows success state after valid submission', async () => {
    // Use fireEvent.change (not userEvent.type) so fake timers don't deadlock
    render(<ContactPage />);

    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { name: 'fullName', value: 'Jane Doe' },
    });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { name: 'email', value: 'jane@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/subject/i), {
      target: { name: 'subject', value: 'Test subject' },
    });
    fireEvent.change(screen.getByLabelText(/message/i), {
      target: { name: 'message', value: 'This is a valid test message.' },
    });

    fireEvent.click(screen.getByRole('button', { name: /send message/i }));

    // The placeholder submit awaits a 1200ms Promise; wait it out for real
    await waitFor(
      () => {
        expect(screen.getByText(/message sent/i)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  it('resets the form when "Send another message" is clicked', async () => {
    render(<ContactPage />);

    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { name: 'fullName', value: 'Jane Doe' },
    });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { name: 'email', value: 'jane@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/subject/i), {
      target: { name: 'subject', value: 'Test subject' },
    });
    fireEvent.change(screen.getByLabelText(/message/i), {
      target: { name: 'message', value: 'This is a valid test message.' },
    });

    fireEvent.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(
      () => {
        expect(screen.getByText(/message sent/i)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    fireEvent.click(screen.getByRole('button', { name: /send another message/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
    });
  });
});
