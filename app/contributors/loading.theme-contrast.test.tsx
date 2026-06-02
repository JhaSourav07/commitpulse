import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Loading from './loading';

function hasClasses(element: Element | null, classes: string[]) {
  expect(element).not.toBeNull();

  for (const className of classes) {
    expect(element!.classList.contains(className)).toBe(true);
  }
}

describe('Contributors loading theme contrast', () => {
  it('renders an accessible loading status', () => {
    render(<Loading />);

    const status = screen.getByRole('status');

    expect(status.getAttribute('aria-live')).toBe('polite');
    expect(screen.getByText('Loading the collective...')).toBeTruthy();
    expect(screen.getByText('Fetching contributor data from GitHub')).toBeTruthy();
  });

  it('applies cohesive dark visual shell classes', () => {
    render(<Loading />);

    const page = screen.getByRole('status').parentElement;

    hasClasses(page, [
      'flex',
      'min-h-screen',
      'items-center',
      'justify-center',
      'bg-[#050505]',
      'text-white',
    ]);
  });

  it('keeps contributor loading text visually readable', () => {
    render(<Loading />);

    const primaryText = screen.getByText('Loading the collective...');
    const secondaryText = screen.getByText('Fetching contributor data from GitHub');

    hasClasses(primaryText, ['text-zinc-400', 'font-light', 'text-lg']);
    hasClasses(secondaryText, ['text-sm', 'text-zinc-600', 'font-mono']);
  });

  it('uses premium spinner styling with visible foreground contrast', () => {
    render(<Loading />);

    const status = screen.getByRole('status');
    const spinnerWrapper = status.firstElementChild;
    const spinner = spinnerWrapper?.firstElementChild ?? null;

    hasClasses(status, ['flex', 'flex-col', 'items-center', 'gap-6']);
    hasClasses(spinnerWrapper, ['relative']);
    hasClasses(spinner, [
      'h-16',
      'w-16',
      'animate-spin',
      'rounded-full',
      'border-2',
      'border-white/10',
      'border-t-cyan-400',
    ]);
  });

  it('keeps glow overlay behind spinner without clipping foreground content', () => {
    render(<Loading />);

    const status = screen.getByRole('status');
    const spinnerWrapper = status.firstElementChild;
    const glowOverlay = spinnerWrapper?.children.item(1) ?? null;

    hasClasses(glowOverlay, [
      'absolute',
      'inset-0',
      'h-16',
      'w-16',
      'rounded-full',
      'bg-cyan-400/20',
      'blur-xl',
      'animate-pulse',
    ]);

    expect(status.classList.contains('overflow-hidden')).toBe(false);
    expect(status.classList.contains('text-transparent')).toBe(false);
  });
});
