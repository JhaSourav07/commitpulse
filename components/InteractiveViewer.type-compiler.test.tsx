import { describe, it, expectTypeOf, expect } from 'vitest';
import React, { ReactNode } from 'react';
import InteractiveViewer, { formatDate } from './InteractiveViewer';
import { z } from 'zod';

// We can define a Zod schema that matches InteractiveViewerProps to test schema validation constraints
const interactiveViewerSchema = z.object({
  children: z.custom<ReactNode>(),
  className: z.string().optional(),
  is3DMode: z.boolean().optional(),
  onRotate3D: z.custom<(dx: number, dy: number) => void>().optional(),
  onReset3D: z.custom<() => void>().optional(),
});

type InteractiveViewerProps = React.ComponentProps<typeof InteractiveViewer>;

describe('InteractiveViewer TypeScript Compiler Validation & Schema Constraints Stability', () => {
  it('imports the interfaces, types, or validation schemas associated with the file', () => {
    // Basic structural check to ensure the schema matches the prop types
    type SchemaType = z.infer<typeof interactiveViewerSchema>;
    expectTypeOf<SchemaType>().toMatchTypeOf<InteractiveViewerProps>();
    expectTypeOf<InteractiveViewerProps>().toMatchTypeOf<SchemaType>();
  });

  it('uses type-testing assertions (expectTypeOf) to enforce field property configurations', () => {
    // Assert specific prop types
    expectTypeOf<InteractiveViewerProps['children']>().toEqualTypeOf<ReactNode>();
    expectTypeOf<InteractiveViewerProps['className']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<InteractiveViewerProps['is3DMode']>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<InteractiveViewerProps['onRotate3D']>().toEqualTypeOf<
      ((dx: number, dy: number) => void) | undefined
    >();
    expectTypeOf<InteractiveViewerProps['onReset3D']>().toEqualTypeOf<(() => void) | undefined>();

    // Also test formatDate signature
    expectTypeOf(formatDate).toEqualTypeOf<(dateStr: string) => string>();
  });

  it('asserts that invalid prop parameters are blocked during static type checking', () => {
    // @ts-expect-error - 'is3DMode' should be boolean, not string
    const invalidProps1: InteractiveViewerProps = { children: <div />, is3DMode: 'true' };

    const invalidProps2: InteractiveViewerProps = {
      children: <div />,
      // @ts-expect-error - 'onRotate3D' expects (dx: number, dy: number) => void
      onRotate3D: (x: string) => {},
    };

    // Validate they are structurally invalid but defined for test
    expect(invalidProps1).toBeDefined();
    expect(invalidProps2).toBeDefined();
  });

  it('verifies custom types accept optional values without compile errors', () => {
    // All props except children are optional
    const minimalProps: InteractiveViewerProps = {
      children: <div>Content</div>,
    };

    expectTypeOf(minimalProps).toMatchTypeOf<InteractiveViewerProps>();

    const partialProps: InteractiveViewerProps = {
      children: <div>Content</div>,
      className: 'test-class',
      is3DMode: true,
    };

    expectTypeOf(partialProps).toMatchTypeOf<InteractiveViewerProps>();
  });

  it('verifies schema validation constraints return strict validation reports', () => {
    const validData = {
      children: <div>Content</div>,
      is3DMode: true,
      className: 'interactive-viewer',
    };

    const resultValid = interactiveViewerSchema.safeParse(validData);
    expect(resultValid.success).toBe(true);

    const invalidData = {
      children: <div>Content</div>,
      is3DMode: 'not-a-boolean', // invalid
    };

    const resultInvalid = interactiveViewerSchema.safeParse(invalidData);
    expect(resultInvalid.success).toBe(false);

    if (!resultInvalid.success) {
      const issue = resultInvalid.error.issues[0];
      expect(issue.code).toBe('invalid_type');
      expect(issue.path).toEqual(['is3DMode']);
      if (issue.code === 'invalid_type') {
        expect(issue.expected).toBe('boolean');
      }
    }
  });
});
