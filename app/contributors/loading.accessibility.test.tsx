import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Loading from './loading';

function hasClasses(element: Element | null, classes: string[]) {
  expect(element).not.toBeNull();

  for (const className of classes) {
    expect(element!.classList.contains(className)).toBe(true);
  }
}

describe('Contributors loading accessibility', () => {
  it('exposes the loading state through a screen-reader status region', () => {
    render(<Loading />);

    const status = screen.getByRole('status');

    expect(status.getAttribute('aria-live')).toBe('polite');
    expect(status.getAttribute('aria-label')).toBe('Loading contributors');
  });

  it('does not keep contributor loading placeholder text in the DOM', () => {
    render(<Loading />);

    expect(screen.queryByText('Loading the collective...')).toBeNull();
    expect(screen.queryByText('Fetching contributor data from GitHub')).toBeNull();
  });

  it('does not expose decorative spinner elements as interactive controls', () => {
    render(<Loading />);

    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('preserves visual focus-friendly layout without hidden foreground text', () => {
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

    expect(status.classList.contains('sr-only')).toBe(false);
    expect(status.classList.contains('hidden')).toBe(false);
    expect(status.classList.contains('text-transparent')).toBe(false);
  });

  it('keeps DOM reading order logical for keyboard and screen-reader traversal', () => {
    render(<Loading />);

    const status = screen.getByRole('status');
    const children = Array.from(status.children);

    expect(children).toHaveLength(1);
    expect(children[0].tagName.toLowerCase()).toBe('div');
  });
});
