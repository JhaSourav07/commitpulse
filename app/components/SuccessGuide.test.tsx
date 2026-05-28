import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { ReactNode } from 'react';
import { SuccessGuide } from './SuccessGuide';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children: ReactNode }) => <div {...props}>{children}</div>,
  },
}));

vi.mock('./Icons', () => ({
  CloseIcon: () => <span>CloseIcon</span>,
}));

describe('SuccessGuide', () => {
  const markdown = '![GitHub Streak](https://example.com/streak.svg)';

  it('renders all 4 step numbers', () => {
    render(<SuccessGuide markdown={markdown} onDismiss={vi.fn()} />);

    expect(screen.getByText('01')).toBeTruthy();
    expect(screen.getByText('02')).toBeTruthy();
    expect(screen.getByText('03')).toBeTruthy();
    expect(screen.getByText('04')).toBeTruthy();
  });

  it('renders the markdown prop in the code block', () => {
    render(<SuccessGuide markdown={markdown} onDismiss={vi.fn()} />);

    expect(screen.getByText(markdown)).toBeTruthy();
  });

  it('renders the dismiss guide button with correct aria-label', () => {
    render(<SuccessGuide markdown={markdown} onDismiss={vi.fn()} />);

    expect(screen.getByLabelText('Dismiss guide')).toBeTruthy();
  });

  it('calls onDismiss when dismiss button is clicked', () => {
    const onDismiss = vi.fn();

    render(<SuccessGuide markdown={markdown} onDismiss={onDismiss} />);

    fireEvent.click(screen.getByLabelText('Dismiss guide'));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('renders the Markdown Copied label', () => {
    render(<SuccessGuide markdown={markdown} onDismiss={vi.fn()} />);

    expect(screen.getByText('Markdown Copied')).toBeTruthy();
  });
});
