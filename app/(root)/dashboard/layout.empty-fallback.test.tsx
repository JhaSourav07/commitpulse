import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import DashboardLayout from './layout';

describe('DashboardLayout empty fallback behavior', () => {
  it('renders safely with null children', () => {
    const { container } = render(<DashboardLayout>{null}</DashboardLayout>);
    expect(container.querySelector('main')).toBeTruthy();
  });

  it('renders safely with undefined children', () => {
    const { container } = render(<DashboardLayout>{undefined}</DashboardLayout>);
    expect(container.querySelector('main')).toBeTruthy();
  });

  it('renders safely with empty string children', () => {
    const { container } = render(<DashboardLayout>{''}</DashboardLayout>);
    expect(container.querySelector('main')).toBeTruthy();
  });

  it('does not throw runtime errors during render with missing content', () => {
    expect(() => render(<DashboardLayout>{null}</DashboardLayout>)).not.toThrow();
  });

  it('maintains expected DOM structure with wrapper div and main element', () => {
    const { container } = render(<DashboardLayout>{null}</DashboardLayout>);
    const wrapper = container.querySelector('div');
    expect(wrapper?.className).toContain('min-h-screen');
    expect(wrapper?.className).toContain('bg-transparent');
    const main = container.querySelector('main');
    expect(main).toBeTruthy();
    expect(main?.className).toContain('max-w-[1600px]');
    expect(main?.className).toContain('mx-auto');
  });
});
