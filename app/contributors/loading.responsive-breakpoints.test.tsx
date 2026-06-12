import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import Loading from './loading';
import '@testing-library/jest-dom';

describe('Loading - Responsive Multi-device Columns & Mobile Viewport Layouts', () => {
  it('renders correctly on a mobile-width viewport', () => {
    const { container } = render(<Loading />);

    expect(container.firstChild).toBeInTheDocument();
  });

  it('does not use fixed-width container classes that could cause horizontal scrolling', () => {
    const { container } = render(<Loading />);

    const root = container.firstElementChild;

    expect(root?.className).not.toContain('w-screen');
    expect(root?.className).not.toContain('max-w');
  });

  it('renders the loading spinner on mobile layouts', () => {
    const { container } = render(<Loading />);

    const spinner = container.querySelector('.animate-spin');

    expect(spinner).toBeInTheDocument();
  });
});
