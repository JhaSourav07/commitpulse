import React, { ComponentProps } from 'react';
import '@testing-library/jest-dom/vitest';
import { render } from '@testing-library/react';
import { describe, expect, it, expectTypeOf } from 'vitest';
import DashboardLayout from './layout';

describe('DashboardLayout - TypeScript Compiler Validation & Schema Constraints Stability', () => {
  it('validates the component signature and prop types using expectTypeOf', () => {
    expectTypeOf(DashboardLayout).toBeFunction();

    type Props = ComponentProps<typeof DashboardLayout>;

    expectTypeOf<Props>().toHaveProperty('children');
    expectTypeOf<Props['children']>().toMatchTypeOf<React.ReactNode>();
  });

  it('verifies required parameters remain stable', () => {
    type Params = Parameters<typeof DashboardLayout>;

    expectTypeOf<Params['length']>().toEqualTypeOf<1>();

    expectTypeOf<Params[0]>().toEqualTypeOf<{
      children: React.ReactNode;
    }>();
  });

  it('asserts invalid prop shapes are rejected at compile time', () => {
    const element = (
      // @ts-expect-error - DashboardLayout does not accept arbitrary props
      <DashboardLayout invalidProp="test">
        <div />
      </DashboardLayout>
    );

    expect(element).toBeDefined();
  });

  it('verifies valid ReactNode children compile successfully and render', () => {
    const { container } = render(
      <DashboardLayout>
        <div>Dashboard</div>
      </DashboardLayout>
    );

    expect(container.firstChild).toBeInTheDocument();
  });

  it('validates component return type constraints remain stable', () => {
    type JSXElement = React.JSX.Element;

    expectTypeOf<ReturnType<typeof DashboardLayout>>().toMatchTypeOf<JSXElement>();
  });
});
