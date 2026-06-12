import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import Template from './template';

// Mock framer-motion to easily inspect the boundary properties passed to the wrapper
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      'data-testid': testId,
      ...props
    }: {
      children?: React.ReactNode;
      'data-testid'?: string;
      [key: string]: unknown;
    }) => (
      <div data-testid={testId || 'motion-div'} data-motion-props={JSON.stringify(props)}>
        {children}
      </div>
    ),
  },
}));

describe('AppTemplate - Timezone Boundaries Equivalent (Animation Boundaries)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const getMotionProps = (container: HTMLElement) => {
    const motionDiv = container.querySelector('[data-testid="motion-div"]');
    if (!motionDiv) throw new Error('Motion div not found');
    const propsStr = motionDiv.getAttribute('data-motion-props');
    return propsStr ? JSON.parse(propsStr) : {};
  };

  it('Transition Boundaries (Daylight Savings Equivalent): strictly defines transition durations without temporal gaps', () => {
    const { container } = render(
      <Template>
        <span />
      </Template>
    );
    const props = getMotionProps(container);

    expect(props.transition).toBeDefined();
    expect(props.transition.duration).toBe(0.3);
    expect(props.transition.ease).toBe('easeInOut');
  });

  it('Initial State Normalization (Leap Year Gaps Equivalent): applies entry offset boundaries accurately', () => {
    const { container } = render(
      <Template>
        <span />
      </Template>
    );
    const props = getMotionProps(container);

    expect(props.initial).toBeDefined();
    expect(props.initial.opacity).toBe(0);
    expect(props.initial.y).toBe(8);
  });

  it('Active State Alignment (Visual Dates Equivalent): aligns active frame to absolute baseline coordinates', () => {
    const { container } = render(
      <Template>
        <span />
      </Template>
    );
    const props = getMotionProps(container);

    expect(props.animate).toBeDefined();
    expect(props.animate.opacity).toBe(1);
    expect(props.animate.y).toBe(0);
  });

  it('Exit State Offsets (Time Offsets Equivalent): forces exact negative spatial displacement upon exit', () => {
    const { container } = render(
      <Template>
        <span />
      </Template>
    );
    const props = getMotionProps(container);

    expect(props.exit).toBeDefined();
    expect(props.exit.opacity).toBe(0);
    expect(props.exit.y).toBe(-8);
  });

  it('Child Node Preservation (Grid Data Integrity Equivalent): ensures content seamlessly passes through boundary wrappers', () => {
    const { getByTestId } = render(
      <Template>
        <div data-testid="preserved-child">Hello Boundary</div>
      </Template>
    );

    const child = getByTestId('preserved-child');
    expect(child).toBeTruthy();
    expect(child.textContent).toBe('Hello Boundary');
  });
});
