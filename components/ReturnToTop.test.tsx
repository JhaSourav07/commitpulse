import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import ReturnToTop from './ReturnToTop';

describe('ReturnToTop', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('adds scroll event listener on mount', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

    render(<ReturnToTop />);

    expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
  });

  it('removes scroll event listener on unmount', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = render(<ReturnToTop />);

    const scrollHandler = addEventListenerSpy.mock.calls.find(([event]) => event === 'scroll')?.[1];

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', scrollHandler);
  });
});
