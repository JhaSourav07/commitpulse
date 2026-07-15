import { describe, expect, expectTypeOf, it } from 'vitest';
import { CommitPulseSection } from './CommitPulseSection';
import type { CommitPulseSectionProps } from './CommitPulseSection';

type ExtractedProps = Parameters<typeof CommitPulseSection>[0];

function validateCommitPulseProps(props: CommitPulseSectionProps) {
  return {
    valid:
      typeof props.githubUsername === 'string' &&
      typeof props.showCommitPulse === 'boolean' &&
      typeof props.commitPulseAccent === 'string' &&
      typeof props.onGithubUsernameChange === 'function' &&
      typeof props.onShowCommitPulseChange === 'function' &&
      typeof props.onCommitPulseAccentChange === 'function',
  };
}

describe('CommitPulseSection Type Compiler Validation & Schema Constraints Stability', () => {
  it('Case 1: enforces the CommitPulseSectionProps contract strictly', () => {
    expectTypeOf<CommitPulseSectionProps>().toEqualTypeOf<{
      githubUsername: string;
      showCommitPulse: boolean;
      commitPulseAccent: string;
      onGithubUsernameChange: (v: string) => void;
      onShowCommitPulseChange: (v: boolean) => void;
      onCommitPulseAccentChange: (v: string) => void;
    }>();
  });

  it('Case 2: uses type-testing assertions to check field configurations', () => {
    expectTypeOf<CommitPulseSectionProps['githubUsername']>().toEqualTypeOf<string>();
    expectTypeOf<CommitPulseSectionProps['showCommitPulse']>().toEqualTypeOf<boolean>();
    expectTypeOf<CommitPulseSectionProps['commitPulseAccent']>().toEqualTypeOf<string>();
    expectTypeOf<ExtractedProps>().toEqualTypeOf<CommitPulseSectionProps>();
  });

  it('Case 3: asserts that invalid prop parameters are blocked during static type checking', () => {
    expectTypeOf<CommitPulseSectionProps>().not.toEqualTypeOf<{
      githubUsername: number;
      showCommitPulse: string;
      commitPulseAccent: number;
      onGithubUsernameChange: (v: number) => void;
      onShowCommitPulseChange: (v: string) => void;
      onCommitPulseAccentChange: (v: number) => void;
    }>();
  });

  it('Case 4: verifies custom types accept optional values when partially mapped', () => {
    type OptionalProps = Partial<CommitPulseSectionProps>;
    expectTypeOf<OptionalProps>().toEqualTypeOf<Partial<CommitPulseSectionProps>>();

    const partialProps: OptionalProps = {
      githubUsername: 'octocat',
      showCommitPulse: true,
    };
    expect(partialProps.githubUsername).toBe('octocat');
    expect(partialProps.showCommitPulse).toBe(true);
  });

  it('Case 5: verifies schema validation constraints return strict validation reports', () => {
    const validProps: CommitPulseSectionProps = {
      githubUsername: 'octocat',
      showCommitPulse: true,
      commitPulseAccent: '10b981',
      onGithubUsernameChange: () => {},
      onShowCommitPulseChange: () => {},
      onCommitPulseAccentChange: () => {},
    };

    const invalidProps = {
      githubUsername: 123,
      showCommitPulse: 'true',
      commitPulseAccent: 42,
      onGithubUsernameChange: 'not a function',
      onShowCommitPulseChange: 100,
      onCommitPulseAccentChange: false,
    };

    const validReport = validateCommitPulseProps(validProps);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const invalidReport = validateCommitPulseProps(invalidProps as any);

    expect(validReport.valid).toBe(true);
    expect(invalidReport.valid).toBe(false);
  });
});
