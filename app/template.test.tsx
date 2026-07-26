import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Template from './template';

type MotionDivProps = React.HTMLAttributes<HTMLDivElement> & {
  children?: React.ReactNode;
  initial?: object;
  animate?: object;
  exit?: object;
  transition?: object;
};

const mockMotionDiv = vi.hoisted(() =>
  vi.fn(({ children, ...rest }: MotionDivProps) => (
    <div data-testid="motion-wrapper" {...(rest as React.HTMLAttributes<HTMLDivElement>)}>
      {children}
    </div>
  ))
);

vi.mock('framer-motion', () => ({
  motion: { div: mockMotionDiv },
}));

afterEach(() => {
  cleanup();
  mockMotionDiv.mockClear();
});

describe('Template', () => {
  it('renders children inside the motion wrapper', () => {
    render(
      <Template>
        <p data-testid="child">Hello CommitPulse</p>
      </Template>
    );

    expect(screen.getByTestId('child').textContent).toBe('Hello CommitPulse');
    expect(screen.getByTestId('motion-wrapper')).toBeDefined();
  });

  it('passes the correct initial and animate transition props to motion.div', () => {
    render(
      <Template>
        <span>test</span>
      </Template>
    );

    const props = mockMotionDiv.mock.lastCall![0] as MotionDivProps;
    expect(props.initial).toEqual({ opacity: 0, y: 8 });
    expect(props.animate).toEqual({ opacity: 1, y: 0 });
    expect(props.transition).toEqual({ duration: 0.3, ease: 'easeInOut' });
  });

  it('preserves nested DOM structure completely', () => {
    render(
      <Template>
        <section data-testid="section">
          <h1 data-testid="heading">Title</h1>
          <p data-testid="paragraph">Body text</p>
          <button data-testid="action">Click me</button>
        </section>
      </Template>
    );

    const section = screen.getByTestId('section');
    expect(section.querySelector('[data-testid="heading"]')?.textContent).toBe('Title');
    expect(section.querySelector('[data-testid="paragraph"]')?.textContent).toBe('Body text');
    expect(section.querySelector('[data-testid="action"]')?.textContent).toBe('Click me');
  });

  it('remounts and resets state when the key changes (page navigation)', () => {
    const { rerender } = render(
      <Template key="page-a">
        <span data-testid="page-content">Page A</span>
      </Template>
    );

    const callsAfterFirstRender = mockMotionDiv.mock.calls.length;
    expect(callsAfterFirstRender).toBeGreaterThan(0);

    rerender(
      <Template key="page-b">
        <span data-testid="page-content">Page B</span>
      </Template>
    );

    expect(mockMotionDiv.mock.calls.length).toBeGreaterThan(callsAfterFirstRender);
    expect(screen.getByTestId('page-content').textContent).toBe('Page B');
  });

  it('passes the correct exit transition props to motion.div', () => {
    render(
      <Template>
        <span>test</span>
      </Template>
    );

    const props = mockMotionDiv.mock.lastCall![0] as MotionDivProps;
    expect(props.exit).toEqual({ opacity: 0, y: -8 });
  });
});
