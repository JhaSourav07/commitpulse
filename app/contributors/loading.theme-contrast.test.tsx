import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Loading from './loading';
import { LOADING_ROOT_CLASSES, LOADING_SPINNER_CLASSES } from './loadingClasses';

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
    expect(status.getAttribute('aria-label')).toBe('Loading contributors');
  });

  it('applies cohesive dark visual shell classes', () => {
    render(<Loading />);

    const page = screen.getByRole('status').parentElement;

    hasClasses(page, LOADING_ROOT_CLASSES);
  });

  it('does not render contributor loading text that can linger after data loads', () => {
    render(<Loading />);

    expect(screen.queryByText('Loading the collective...')).toBeNull();
    expect(screen.queryByText('Fetching contributor data from GitHub')).toBeNull();
  });

  it('uses premium spinner styling with visible foreground contrast', () => {
    render(<Loading />);

    const status = screen.getByRole('status');
    const spinnerWrapper = status.firstElementChild;
    const spinner = spinnerWrapper?.firstElementChild ?? null;

    hasClasses(status, ['flex', 'flex-col', 'items-center', 'gap-6']);
    hasClasses(spinnerWrapper, ['relative']);
    hasClasses(spinner, LOADING_SPINNER_CLASSES);
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
