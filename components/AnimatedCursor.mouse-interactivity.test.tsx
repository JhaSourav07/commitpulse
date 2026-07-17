import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import AnimatedCursor from './AnimatedCursor';

describe('AnimatedCursor Mouse Interactivity', () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === '(pointer: fine)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    document.body.style.cursor = '';
  });

  it('renders dot and ring cursor elements', () => {
    const { container } = render(<AnimatedCursor />);

    expect(container.children).toHaveLength(2);
  });

  it('disables native cursor on body when pointer device is detected', () => {
    render(<AnimatedCursor />);

    expect(document.body.style.cursor).toBe('none');
  });

  it('applies hover styling on ring when hovering over interactive element', async () => {
    const { container } = render(
      <>
        <AnimatedCursor />
        <button>Hover Target</button>
      </>
    );

    fireEvent.mouseOver(screen.getByRole('button'));

    const ring = container.children[1] as HTMLElement;
    await waitFor(() => {
      expect(ring.style.border).toContain('rgb(88, 166, 255)');
      expect(ring.style.background).toContain('rgba(88, 166, 255, 0.08)');
    });
  });

  it('removes hover styling from ring when mouse leaves interactive element', async () => {
    const { container } = render(
      <>
        <AnimatedCursor />
        <button>Hover Target</button>
      </>
    );

    const button = screen.getByRole('button');
    fireEvent.mouseOver(button);
    await waitFor(() => {
      expect((container.children[1] as HTMLElement).style.border).toContain('rgb(88, 166, 255)');
    });

    fireEvent.mouseOut(button);
    await waitFor(() => {
      const ring = container.children[1] as HTMLElement;
      expect(ring.style.border).toContain('rgba(88, 166, 255, 0.5)');
      expect(ring.style.background).toBe('transparent');
    });
  });

  it('does not intercept click events on interactive elements', () => {
    const handleClick = vi.fn();

    render(
      <>
        <AnimatedCursor />
        <button onClick={handleClick}>Click Me</button>
      </>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Click Me' }));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('updates dot position on mouse move', () => {
    const { container } = render(<AnimatedCursor />);

    fireEvent.mouseMove(window, { clientX: 200, clientY: 150 });

    const dot = container.children[0] as HTMLElement;
    expect(dot.style.transform).toBe('translate(196px, 146px)');
  });
});
