import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import CopyRepoButton from './CopyRepoButton';

vi.mock('lucide-react', () => ({
  Copy: () => <svg data-testid="copy-icon" />,
}));

describe('CopyRepoButton theme contrast behavior', () => {
  it('includes light mode background and border contrast classes', () => {
    render(<CopyRepoButton />);

    const button = screen.getByRole('button', { name: /copy url/i });

    expect(button.className).toContain('bg-white/60');
    expect(button.className).toContain('border-black/10');
  });

  it('includes dark mode background and border contrast classes', () => {
    render(<CopyRepoButton />);

    const button = screen.getByRole('button', { name: /copy url/i });

    expect(button.className).toContain('dark:bg-white/5');
    expect(button.className).toContain('dark:border-white/10');
  });

  it('keeps readable font weight for button text', () => {
    render(<CopyRepoButton />);

    expect(screen.getByRole('button').className).toContain('font-semibold');
  });

  it('preserves spacing classes so icon and text do not overlap', () => {
    render(<CopyRepoButton />);

    const button = screen.getByRole('button');

    expect(button.className).toContain('inline-flex');
    expect(button.className).toContain('items-center');
    expect(button.className).toContain('gap-2');
  });

  it('keeps transition and hover classes without removing contrast styling', () => {
    render(<CopyRepoButton />);

    const button = screen.getByRole('button');

    expect(button.className).toContain('transition-all');
    expect(button.className).toContain('hover:scale-105');
    expect(button.className).toContain('bg-white/60');
    expect(button.className).toContain('dark:bg-white/5');
  });
});
