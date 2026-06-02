import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Loading from './loading';

function hasClasses(element: Element | null, classes: string[]) {
  expect(element).not.toBeNull();

  for (const className of classes) {
    expect(element!.classList.contains(className)).toBe(true);
  }
}

describe('Contributors loading empty fallback', () => {
  it('renders safely without props or input data', () => {
    expect(() => render(<Loading />)).not.toThrow();
  });

  it('shows a clear fallback loading state', () => {
    render(<Loading />);

    expect(screen.getByRole('status')).toBeTruthy();
    expect(screen.getByText('Loading the collective...')).toBeTruthy();
    expect(screen.getByText('Fetching contributor data from GitHub')).toBeTruthy();
  });

  it('keeps accessible fallback markers available', () => {
    render(<Loading />);

    const status = screen.getByRole('status');

    expect(status.getAttribute('aria-live')).toBe('polite');
    expect(status.children.length).toBeGreaterThanOrEqual(2);
  });

  it('maintains default fallback layout styles', () => {
    render(<Loading />);

    const status = screen.getByRole('status');
    const page = status.parentElement;

    hasClasses(page, [
      'flex',
      'min-h-screen',
      'items-center',
      'justify-center',
      'bg-[#050505]',
      'text-white',
    ]);

    hasClasses(status, ['flex', 'flex-col', 'items-center', 'gap-6']);
  });

  it('renders fallback spinner structure without hydration-sensitive content', () => {
    render(<Loading />);

    const status = screen.getByRole('status');
    const spinnerWrapper = status.firstElementChild;
    const spinner = spinnerWrapper?.firstElementChild ?? null;
    const glowOverlay = spinnerWrapper?.children.item(1) ?? null;

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
