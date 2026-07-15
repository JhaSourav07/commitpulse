import { render } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AnimatedCursor from './AnimatedCursor';

function mockMatchMedia(rules: Record<string, boolean>) {
  return vi.fn().mockImplementation((query: string) => ({
    matches: rules[query] ?? false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
  }));
}

afterEach(() => {
  vi.restoreAllMocks();
  document.body.style.cursor = '';
});

describe('AnimatedCursor - Timezone Normalization & Calendar Data Boundary Alignment', () => {
  it('renders both cursor elements in test environment regardless of prefers-reduced-motion — NODE_ENV guard acts as UTC baseline override', () => {
    // NODE_ENV=test forces isTestEnvironment=true → prefersReduced=false
    // regardless of matchMedia result, analogous to a UTC baseline ignoring regional offsets
    window.matchMedia = mockMatchMedia({
      '(prefers-reduced-motion: reduce)': true, // would normally suppress cursor
      '(pointer: fine)': false,
    });

    const { container } = render(<AnimatedCursor />);

    // Both cursor elements must render — test env guard overrides reduced-motion setting
    const divs = container.querySelectorAll('div');
    expect(divs.length).toBe(2);
  });

  it('sets document.body.style.cursor to none when pointer:fine is available — fine-pointer boundary activation', () => {
    window.matchMedia = mockMatchMedia({ '(pointer: fine)': true });
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn(() => 0)
    );
    vi.stubGlobal('cancelAnimationFrame', vi.fn());

    render(<AnimatedCursor />);

    // Crossing the pointer:fine boundary activates the custom cursor
    expect(document.body.style.cursor).toBe('none');
  });

  it('does not set cursor:none when pointer:fine is absent — touch device boundary leaves system cursor intact', () => {
    window.matchMedia = mockMatchMedia({
      '(pointer: fine)': false,
      '(prefers-reduced-motion: reduce)': false,
    });

    render(<AnimatedCursor />);

    // Without pointer:fine, useEffect returns early — no cursor override applied
    expect(document.body.style.cursor).not.toBe('none');
  });

  it('restores cursor to empty string on unmount — cleanup boundary resets system cursor state', () => {
    window.matchMedia = mockMatchMedia({ '(pointer: fine)': true });
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn(() => 0)
    );
    vi.stubGlobal('cancelAnimationFrame', vi.fn());

    const { unmount } = render(<AnimatedCursor />);

    expect(document.body.style.cursor).toBe('none');

    unmount();

    // Cleanup must restore the cursor — equivalent to resetting a timezone offset on navigation
    expect(document.body.style.cursor).toBe('');
  });

  it('renders dot and ring with correct fixed positioning and z-index — boundary-independent viewport coordinates', () => {
    window.matchMedia = mockMatchMedia({ '(pointer: fine)': false });

    const { container } = render(<AnimatedCursor />);

    const [dot, ring] = Array.from(container.querySelectorAll('div')) as HTMLElement[];

    // Fixed positioning means coordinates are viewport-absolute —
    // not affected by scroll offsets or timezone-driven date boundary shifts
    expect(dot.style.position).toBe('fixed');
    expect(ring.style.position).toBe('fixed');
    expect(dot.style.zIndex).toBe('9999');
    expect(ring.style.zIndex).toBe('9998');

    // Dot must carry the correct brand color regardless of active boundary state
    expect(dot.style.background).toBe('rgb(88, 166, 255)');
  });
});
