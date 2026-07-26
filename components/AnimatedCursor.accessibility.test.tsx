import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AnimatedCursor from './AnimatedCursor';

const renderAccessiblePageWithCursor = () =>
  render(
    <>
      <a href="#content">Skip to content</a>
      <AnimatedCursor />
      <main id="content" aria-labelledby="page-title">
        <h1 id="page-title">Animated cursor accessibility fixture</h1>
        <section aria-labelledby="actions-title">
          <h2 id="actions-title">Actions</h2>
          <button
            type="button"
            aria-describedby="save-tooltip"
            style={{ outline: '2px solid currentColor', outlineOffset: '2px' }}
          >
            Save changes
          </button>
          <span id="save-tooltip" role="tooltip">
            Saves the current accessibility settings.
          </span>
          <input aria-label="Repository name" />
        </section>
      </main>
    </>
  );

const getCursorLayers = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('div')).filter(
    (element) => element.style.position === 'fixed' && element.style.pointerEvents === 'none'
  );

describe('AnimatedCursor Accessibility', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({
        matches: true,
        media: '(pointer: fine)',
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })
    );
    vi.stubGlobal('requestAnimationFrame', vi.fn().mockReturnValue(1));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.style.cursor = '';
  });

  it('keeps the rendered cursor layers decorative and unlabeled', () => {
    const { container } = renderAccessiblePageWithCursor();

    const cursorLayers = getCursorLayers(container);

    expect(cursorLayers).toHaveLength(2);
    for (const layer of cursorLayers) {
      expect(layer).not.toHaveAttribute('role');
      expect(layer).not.toHaveAttribute('aria-label');
      expect(layer).not.toHaveAttribute('aria-labelledby');
      expect(layer).not.toHaveAttribute('aria-describedby');
      expect(layer).toHaveStyle({ pointerEvents: 'none' });
    }
  });

  it('does not introduce focusable cursor nodes that would require custom outlines', async () => {
    const user = userEvent.setup();
    const { container } = renderAccessiblePageWithCursor();

    await user.tab();
    expect(screen.getByRole('link', { name: /skip to content/i })).toHaveFocus();

    for (const layer of getCursorLayers(container)) {
      expect(layer).not.toHaveAttribute('tabindex');
      expect(layer).not.toHaveFocus();
    }
  });

  it('preserves visible outline styling on keyboard-focused controls near the cursor overlay', async () => {
    const user = userEvent.setup();
    renderAccessiblePageWithCursor();

    await user.tab();
    await user.tab();

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    expect(saveButton).toHaveFocus();
    expect(saveButton.style.outline).toBe('2px solid currentColor');
    expect(saveButton.style.outlineOffset).toBe('2px');
  });

  it('leaves tooltip descriptions announced through aria-describedby', () => {
    renderAccessiblePageWithCursor();

    expect(screen.getByRole('button', { name: /save changes/i })).toHaveAccessibleDescription(
      'Saves the current accessibility settings.'
    );
    expect(screen.getByRole('tooltip')).toHaveTextContent(
      'Saves the current accessibility settings.'
    );
  });

  it('does not disturb keyboard tab order or logical heading hierarchy', async () => {
    const user = userEvent.setup();
    renderAccessiblePageWithCursor();

    await user.tab();
    expect(screen.getByRole('link', { name: /skip to content/i })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: /save changes/i })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('textbox', { name: /repository name/i })).toHaveFocus();

    const headings = screen.getAllByRole('heading').map((heading) => ({
      level: Number(heading.getAttribute('aria-level') ?? heading.tagName.slice(1)),
      name: heading.textContent,
    }));

    expect(headings).toEqual([
      { level: 1, name: 'Animated cursor accessibility fixture' },
      { level: 2, name: 'Actions' },
    ]);
  });
});
