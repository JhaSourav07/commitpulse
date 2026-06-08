import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SuccessGuide } from './SuccessGuide';

// Mock framer-motion (NO any)
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      ...props
    }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

// Mock CloseIcon
vi.mock('./Icons', () => ({
  CloseIcon: () => <svg data-testid="close-icon" />,
}));

describe('SuccessGuide - Empty/Fallback States', () => {
  it('renders successfully with empty markdown', () => {
    render(<SuccessGuide markdown="" onDismiss={vi.fn()} />);

    expect(screen.getByText(/Markdown Copied/i)).toBeInTheDocument();
    expect(screen.getByText(/Your copied snippet/i)).toBeInTheDocument();
  });

  it('renders an empty code block without breaking layout', () => {
    const { container } = render(<SuccessGuide markdown="" onDismiss={vi.fn()} />);

    const code = container.querySelector('code');

    expect(code).toBeTruthy();
    expect(code?.textContent).toBe('');
  });

  it('maintains wrapper styles in empty state', () => {
    const { container } = render(<SuccessGuide markdown="" onDismiss={vi.fn()} />);

    expect(container.querySelector('.max-w-4xl')).toBeTruthy();
    expect(container.querySelector('.rounded-\\[2rem\\]')).toBeTruthy();
  });

  it('renders all four guide steps even when markdown is empty', () => {
    render(<SuccessGuide markdown="" onDismiss={vi.fn()} />);

    expect(screen.getByText('Open Your Profile Repo')).toBeInTheDocument();
    expect(screen.getByText('Edit README.md')).toBeInTheDocument();
    expect(screen.getByText('Paste the Snippet')).toBeInTheDocument();
    expect(screen.getByText('Save & Ship It')).toBeInTheDocument();
  });

  it('dismiss button works without errors', () => {
    const onDismiss = vi.fn();

    render(<SuccessGuide markdown="" onDismiss={onDismiss} />);

    const button = screen.getByRole('button', {
      name: /dismiss guide/i,
    });

    fireEvent.click(button);

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
