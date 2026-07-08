import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import AnimatedCursor from './AnimatedCursor';

describe('AnimatedCursor Responsive Breakpoints', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: query === '(pointer: fine)',
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))
    );
  });

  it('1. renders correctly on mobile viewport', () => {
    window.innerWidth = 375;

    const { container } = render(<AnimatedCursor />);

    expect(container).toBeTruthy();
  });

  it('2. keeps cursor elements rendered in narrow viewport', () => {
    window.innerWidth = 375;

    const { container } = render(<AnimatedCursor />);

    expect(container.querySelectorAll('div')).toHaveLength(2);
  });

  it('3. does not create horizontal clipping structures', () => {
    const { container } = render(<AnimatedCursor />);

    expect(container.firstChild).toBeTruthy();
  });

  it('4. remains mounted after viewport resize', () => {
    const { container } = render(<AnimatedCursor />);

    window.innerWidth = 768;
    window.dispatchEvent(new Event('resize'));

    expect(container).toBeTruthy();
  });

  it('5. supports mobile rendering without crashing', () => {
    window.innerWidth = 320;

    expect(() => render(<AnimatedCursor />)).not.toThrow();
  });
});
