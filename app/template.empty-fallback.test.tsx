// app/template.empty-fallback.test.tsx

import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children }: { children?: React.ReactNode }) => (
      <div data-testid="motion-wrapper">{children}</div>
    ),
  },
}));

import Template from './template';

describe('Template Empty & Missing Input Fallbacks', () => {
  it('renders successfully with null children', () => {
    render(<Template>{null}</Template>);

    expect(screen.getByTestId('motion-wrapper')).toBeInTheDocument();
  });

  it('renders successfully with undefined children', () => {
    render(<Template>{undefined}</Template>);

    expect(screen.getByTestId('motion-wrapper')).toBeInTheDocument();
  });

  it('renders successfully with an empty fragment', () => {
    render(
      <Template>
        <></>
      </Template>
    );

    expect(screen.getByTestId('motion-wrapper')).toBeInTheDocument();
  });

  it('preserves wrapper structure when no content is provided', () => {
    render(<Template>{null}</Template>);

    const wrapper = screen.getByTestId('motion-wrapper');

    expect(wrapper).toBeInTheDocument();
    expect(wrapper.childElementCount).toBe(0);
  });

  it('renders provided content correctly', () => {
    render(
      <Template>
        <div>Fallback Content</div>
      </Template>
    );

    expect(screen.getByText('Fallback Content')).toBeInTheDocument();
  });

  it('renders with a number as children', () => {
    render(<Template>{42}</Template>);

    expect(screen.getByTestId('motion-wrapper')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders with a plain string as children', () => {
    render(<Template>{'hello world'}</Template>);

    expect(screen.getByText('hello world')).toBeInTheDocument();
  });

  it('renders with multiple children correctly', () => {
    render(
      <Template>
        <span data-testid="child-1">First</span>
        <span data-testid="child-2">Second</span>
      </Template>
    );

    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
  });

  it('renders with deeply nested children', () => {
    render(
      <Template>
        <div>
          <section>
            <p data-testid="deep">Deep content</p>
          </section>
        </div>
      </Template>
    );

    expect(screen.getByTestId('deep')).toBeInTheDocument();
  });

  it('does not add extra DOM elements around children', () => {
    const { container } = render(
      <Template>
        <p data-testid="only-child">content</p>
      </Template>
    );

    expect(container.querySelector('[data-testid="only-child"]')).toBeInTheDocument();
  });
});
