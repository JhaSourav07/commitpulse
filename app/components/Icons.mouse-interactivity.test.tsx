import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { BoxIcon, CheckIcon, CloseIcon, CopyIcon, ZapIcon } from './Icons';

describe('Icons mouse interactivity & event propagation', () => {
  it('allows mouse event propagation when CopyIcon is clicked', () => {
    const handleClick = vi.fn();
    const { container } = render(
      <button onClick={handleClick}>
        <CopyIcon />
      </button>
    );

    const svg = container.querySelector('svg');
    if (svg) {
      fireEvent.click(svg);
    }

    // Verifies that clicks on the SVG propagate up to interactive parent elements
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('allows mouse event propagation when ZapIcon is clicked', () => {
    const handleClick = vi.fn();
    const { container } = render(
      <button onClick={handleClick}>
        <ZapIcon />
      </button>
    );

    const svg = container.querySelector('svg');
    if (svg) fireEvent.click(svg);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('allows mouse event propagation when BoxIcon is clicked', () => {
    const handleClick = vi.fn();
    const { container } = render(
      <div onClick={handleClick}>
        <BoxIcon />
      </div>
    );

    const svg = container.querySelector('svg');
    if (svg) fireEvent.click(svg);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('allows mouse event propagation when CheckIcon is clicked', () => {
    const handleClick = vi.fn();
    const { container } = render(
      <button onClick={handleClick}>
        <CheckIcon />
      </button>
    );

    const svg = container.querySelector('svg');
    if (svg) fireEvent.click(svg);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('allows mouse event propagation when CloseIcon is clicked', () => {
    const handleClick = vi.fn();
    const { container } = render(
      <button onClick={handleClick}>
        <CloseIcon />
      </button>
    );

    const svg = container.querySelector('svg');
    if (svg) fireEvent.click(svg);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
