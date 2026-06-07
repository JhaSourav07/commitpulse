import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { BoxIcon, CheckIcon, CloseIcon, CopyIcon, ZapIcon } from './Icons';

describe('Icons error resilience behavior', () => {
  it('CopyIcon remains stable across repeated rerenders', () => {
    const { container, rerender } = render(<CopyIcon />);

    rerender(<CopyIcon />);
    rerender(<CopyIcon />);
    rerender(<CopyIcon />);

    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('ZapIcon remains stable after unmount and remount', () => {
    const { unmount } = render(<ZapIcon />);

    unmount();

    const { container } = render(<ZapIcon />);

    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('renders all icons together without runtime failures', () => {
    const { container } = render(
      <>
        <CopyIcon />
        <ZapIcon />
        <BoxIcon />
        <CheckIcon />
        <CloseIcon />
      </>
    );

    expect(container.querySelectorAll('svg')).toHaveLength(5);
  });

  it('renders icons safely inside a wrapper component', () => {
    function IconWrapper() {
      return (
        <>
          <CopyIcon />
          <ZapIcon />
          <BoxIcon />
          <CheckIcon />
          <CloseIcon />
        </>
      );
    }

    const { container } = render(<IconWrapper />);

    expect(container.querySelectorAll('svg')).toHaveLength(5);
  });

  it('does not emit console errors during repeated icon renders', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<CopyIcon />);
    render(<CopyIcon />);
    render(<CopyIcon />);

    expect(errorSpy).not.toHaveBeenCalled();

    errorSpy.mockRestore();
  });
});
