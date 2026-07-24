import type { GeneratorState } from '../types';
import { describe, it, expectTypeOf, expect } from 'vitest';
import React from 'react';
import { PreviewPanel } from './PreviewPanel';

const mockState: GeneratorState = {
  name: '',
  description: '',
  selectedTechs: [],
  selectedSocials: [],
  socialLinks: {},
  githubUsername: 'test',
  showCommitPulse: false,
  commitPulseAccent: '',
  showRepoSpotlight: false,
  spotlightRepo: '',
  showSnakeGraph: false,
  showPacmanGraph: false,
  graphPlacement: 'bottom',
};

describe('PreviewPanel Type Compiler Validation', () => {
  it('exports PreviewPanel as a callable React component', () => {
    expectTypeOf<typeof PreviewPanel>().toBeFunction();
  });

  it('accepts component props', () => {
    type Props = React.ComponentProps<typeof PreviewPanel>;

    expectTypeOf<Props>().toMatchObjectType<{
      markdown: string;
      state: GeneratorState;
      hasContent?: boolean;
    }>();
  });

  it('preserves component prop schema', () => {
    type Props = React.ComponentProps<typeof PreviewPanel>;

    expectTypeOf<Props['markdown']>().toEqualTypeOf<string>();
  });

  it('supports compile-time validation for component props', () => {
    const validProps: React.ComponentProps<typeof PreviewPanel> = {
      markdown: '# Hello World',
      state: mockState,
    };

    expect(validProps.markdown).toBe('# Hello World');

    const invalidProps: React.ComponentProps<typeof PreviewPanel> = {
      // @ts-expect-error - markdown must be a string
      markdown: 123,
      state: mockState,
    };

    expect(invalidProps).toBeDefined();

    expect(invalidProps).toBeDefined();
  });

  it('accepts a valid props object', () => {
    const props: React.ComponentProps<typeof PreviewPanel> = {
      markdown: 'Sample markdown',
      state: mockState,
    };

    expect(props.markdown).toBe('Sample markdown');
  });
});
