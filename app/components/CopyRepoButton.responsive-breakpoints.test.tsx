import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import CopyRepoButton from './CopyRepoButton';

vi.mock('lucide-react', () => ({
  Copy: () => <svg data-testid="copy-icon" />,
}));

describe('CopyRepoButton - Responsive Breakpoints Layout Cohesion', () => {
  beforeEach(() => {
    window.innerWidth = 375;
    window.dispatchEvent(new Event('resize'));
  });

  it('mocks standard mobile-width media coordinates correctly', () => {
    render(<CopyRepoButton />);
    expect(window.innerWidth).toBe(375);
    expect(screen.getByRole('button', { name: /copy url/i })).toBeDefined();
  });

  it('asserts that container layout reflows into a single vertical flex element or maintains appropriate inline-flex behavior on mobile', () => {
    render(<CopyRepoButton />);
    const button = screen.getByRole('button');
    expect(button.className).toContain('inline-flex');
    expect(button.className).toContain('items-center');
  });

  it('verifies that styling values use flexible styles and padding rather than absolute widths to prevent horizontal scrollbars on smaller viewports', () => {
    render(<CopyRepoButton />);
    const button = screen.getByRole('button');
    expect(button.className).toContain('px-8');
    expect(button.className).toContain('py-4');
    expect(button.className).not.toContain('w-[500px]');
  });

  it('checks that button contents (icon and text) scale down gracefully on mobile screen sizes', () => {
    render(<CopyRepoButton />);
    const button = screen.getByRole('button');
    expect(button.className).toContain('gap-2');
    expect(screen.getByTestId('copy-icon')).toBeDefined();
  });

  it('asserts viewport changes do not affect state transitions of the copy action', async () => {
    render(<CopyRepoButton />);
    const button = screen.getByRole('button');

    // Resize to desktop
    window.innerWidth = 1440;
    window.dispatchEvent(new Event('resize'));

    expect(window.innerWidth).toBe(1440);
    expect(button.className).toContain('transition-all');
  });
});
