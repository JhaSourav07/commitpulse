import { describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import NotFound from './not-found';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('NotFound — massive scaling', () => {
  it('renders successfully across many repeated mounts', () => {
    for (let i = 0; i < 250; i++) {
      const { unmount } = render(<NotFound />);
      expect(screen.getAllByText('404').length).toBe(3);
      unmount();
    }
  });

  it('maintains terminal content integrity during repeated renders', () => {
    for (let i = 0; i < 100; i++) {
      render(<NotFound />);

      expect(screen.getByText(/The page you're looking for has been rebased/i)).toBeInTheDocument();

      cleanup();
    }
  });

  it('keeps navigation links available under high render volume', () => {
    render(
      <>
        {Array.from({ length: 50 }).map((_, index) => (
          <div key={index}>
            <NotFound />
          </div>
        ))}
      </>
    );

    expect(screen.getAllByRole('link', { name: /go back home/i })).toHaveLength(50);

    expect(screen.getAllByRole('link', { name: /git checkout main/i })).toHaveLength(50);
  });

  it('renders within acceptable performance limits', () => {
    const start = performance.now();

    for (let i = 0; i < 100; i++) {
      const { unmount } = render(<NotFound />);
      unmount();
    }

    const duration = performance.now() - start;

    expect(duration).toBeLessThan(5000);
  });

  it('preserves layout structure under bulk rendering conditions', () => {
    const { container } = render(
      <>
        {Array.from({ length: 25 }).map((_, index) => (
          <NotFound key={index} />
        ))}
      </>
    );

    const mainElements = container.querySelectorAll('main');

    expect(mainElements.length).toBe(25);

    mainElements.forEach((element) => {
      expect(element.className).toContain('min-h-screen');
      expect(element.className).toContain('flex');
    });
  });
});
