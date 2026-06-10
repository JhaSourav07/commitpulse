import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Template from './template';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div data-testid="motion-div" {...props}>
        {children}
      </div>
    ),
  },
}));

describe('Template - Massive Scaling Tests', () => {
  it('renders thousands of child elements', () => {
    const massiveData = Array.from({ length: 5000 }, (_, i) => <div key={i}>Contributor {i}</div>);

    render(<Template>{massiveData}</Template>);

    expect(screen.getByText('Contributor 0')).toBeInTheDocument();
    expect(screen.getByText('Contributor 4999')).toBeInTheDocument();
  });

  it('handles extremely large text content', () => {
    const hugeText = 'A'.repeat(100000);

    render(
      <Template>
        <div>{hugeText}</div>
      </Template>
    );

    expect(screen.getByText(hugeText)).toBeInTheDocument();
  });

  it('renders nested large structures correctly', () => {
    const nestedContent = Array.from({ length: 1000 }, (_, i) => (
      <div key={i}>
        <span>User {i}</span>
      </div>
    ));

    render(<Template>{nestedContent}</Template>);

    expect(screen.getByText('User 0')).toBeInTheDocument();
    expect(screen.getByText('User 999')).toBeInTheDocument();
  });

  it('maintains wrapper during heavy rendering', () => {
    render(
      <Template>
        {Array.from({ length: 2000 }, (_, i) => (
          <p key={i}>Metric {i}</p>
        ))}
      </Template>
    );

    expect(screen.getByTestId('motion-div')).toBeInTheDocument();
  });

  it('renders without crashing under extreme load', () => {
    const extremeContent = Array.from({ length: 10000 }, (_, i) => <div key={i}>Record {i}</div>);

    expect(() => {
      render(<Template>{extremeContent}</Template>);
    }).not.toThrow();
  });
});
