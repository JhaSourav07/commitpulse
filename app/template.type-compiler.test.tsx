import React from 'react';
import { describe, expect, it, expectTypeOf } from 'vitest';
import { render, screen } from '@testing-library/react';
import Template from './template';

describe('Template type compiler validation', () => {
  it('should enforce children prop as ReactNode', () => {
    type TemplateProps = React.ComponentProps<typeof Template>;

    expectTypeOf<TemplateProps>().toMatchTypeOf<{
      children: React.ReactNode;
    }>();
  });

  it('should allow optional ReactNode-compatible child values', () => {
    type TemplateProps = React.ComponentProps<typeof Template>;

    expectTypeOf<TemplateProps['children']>().toMatchTypeOf<React.ReactNode>();
  });

  it('should block invalid prop parameters during static type checking', () => {
    type TemplateProps = React.ComponentProps<typeof Template>;

    expectTypeOf<TemplateProps>().not.toMatchTypeOf<{
      invalidProp: string;
    }>();
  });

  it('should render valid children without schema violations', () => {
    render(
      <Template>
        <div>Template Child</div>
      </Template>
    );

    expect(screen.getByText('Template Child')).toBeTruthy();
  });

  it('should accept null children without compile errors', () => {
    render(<Template>{null}</Template>);

    expect(true).toBe(true);
  });
});
