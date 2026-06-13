import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { ReactNode } from 'react';
import { SuccessGuide } from './SuccessGuide';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children?: ReactNode }) => <div {...props}>{children}</div>,
  },
}));

vi.mock('./Icons', () => ({
  CloseIcon: () => <span>CloseIcon</span>,
}));

vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('SuccessGuide massive scaling', () => {
  const createLargeMarkdown = () =>
    Array.from(
      { length: 5000 },
      (_, i) => `![badge-${i}](https://commitpulse.vercel.app/api/streak?user=user${i})`
    ).join('\n');

  it('renders extremely large markdown payloads without truncation', () => {
    const markdown = createLargeMarkdown();

    render(<SuccessGuide markdown={markdown} onDismiss={vi.fn()} />);

    const codeElement = screen.getByLabelText('Your badge markdown snippet');

    expect(codeElement.textContent).toBe(markdown);
  });

  it('preserves all guide steps when rendering large markdown content', () => {
    const markdown = createLargeMarkdown();

    render(<SuccessGuide markdown={markdown} onDismiss={vi.fn()} />);

    expect(screen.getByText('01')).toBeInTheDocument();
    expect(screen.getByText('02')).toBeInTheDocument();
    expect(screen.getByText('03')).toBeInTheDocument();
    expect(screen.getByText('04')).toBeInTheDocument();
  });

  it('renders repeatedly without layout instability', () => {
    const markdown = createLargeMarkdown();

    for (let i = 0; i < 100; i++) {
      const { unmount } = render(<SuccessGuide markdown={markdown} onDismiss={vi.fn()} />);

      expect(screen.getByRole('region')).toBeInTheDocument();

      unmount();
    }
  });

  it('maintains acceptable render performance under repeated mounts', () => {
    const markdown = createLargeMarkdown();

    const start = performance.now();

    for (let i = 0; i < 50; i++) {
      const { unmount } = render(<SuccessGuide markdown={markdown} onDismiss={vi.fn()} />);

      unmount();
    }

    const duration = performance.now() - start;

    expect(duration).toBeLessThan(5000);
  });

  it('keeps dismiss functionality stable under heavy rendering conditions', () => {
    const onDismiss = vi.fn();

    render(<SuccessGuide markdown={createLargeMarkdown()} onDismiss={onDismiss} />);

    const dismissButton = screen.getByRole('button', {
      name: /dismiss guide/i,
    });

    for (let i = 0; i < 25; i++) {
      fireEvent.click(dismissButton);
    }

    expect(onDismiss).toHaveBeenCalledTimes(25);
  });
});
