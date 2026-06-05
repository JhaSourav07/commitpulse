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
});
