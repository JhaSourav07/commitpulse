import { describe, it, expectTypeOf } from 'vitest';
import type { CommitPulseSectionProps } from './CommitPulseSection';

describe('CommitPulseSection Type Compiler & Schema Validation', () => {
  it('1. should enforce strict types on CommitPulseSectionProps core fields', () => {
    expectTypeOf<CommitPulseSectionProps>().toHaveProperty('githubUsername').toBeString();
    expectTypeOf<CommitPulseSectionProps>().toHaveProperty('showCommitPulse').toBeBoolean();
    expectTypeOf<CommitPulseSectionProps>().toHaveProperty('commitPulseAccent').toBeString();
  });

  it('2. should enforce correct function signatures for all handlers', () => {
    expectTypeOf<CommitPulseSectionProps['onGithubUsernameChange']>().toBeCallableWith('username');
    expectTypeOf<CommitPulseSectionProps['onGithubUsernameChange']>().returns.toBeVoid();

    expectTypeOf<CommitPulseSectionProps['onShowCommitPulseChange']>().toBeCallableWith(true);
    expectTypeOf<CommitPulseSectionProps['onShowCommitPulseChange']>().returns.toBeVoid();

    expectTypeOf<CommitPulseSectionProps['onCommitPulseAccentChange']>().toBeCallableWith('accent');
    expectTypeOf<CommitPulseSectionProps['onCommitPulseAccentChange']>().returns.toBeVoid();
  });

  it('3. should block invalid prop parameters during static type checking', () => {
    type ExpectedShape = {
      githubUsername: string;
      showCommitPulse: boolean;
      commitPulseAccent: string;
      onGithubUsernameChange: (v: string) => void;
      onShowCommitPulseChange: (v: boolean) => void;
      onCommitPulseAccentChange: (v: string) => void;
      onReset?: () => void;
    };

    // This ensures no extra or missing fields exist in the interface
    expectTypeOf<CommitPulseSectionProps>().toEqualTypeOf<ExpectedShape>();
  });

  it('4. should accept optional values without compile errors', () => {
    // Verify that omitting optional fields maintains type compatibility
    type MandatoryProps = Omit<CommitPulseSectionProps, 'onReset'>;

    const mockMandatoryProps: MandatoryProps = {
      githubUsername: 'octocat',
      showCommitPulse: true,
      commitPulseAccent: '10b981',
      onGithubUsernameChange: () => {},
      onShowCommitPulseChange: () => {},
      onCommitPulseAccentChange: () => {},
    };

    // Should be assignable to the main props interface even without onReset
    expectTypeOf(mockMandatoryProps).toMatchTypeOf<CommitPulseSectionProps>();

    // onReset should accept a void function or undefined
    expectTypeOf<CommitPulseSectionProps['onReset']>().extract<(() => void) | undefined>();
  });

  it('5. should restrict prop types to their specific exact types (negative testing)', () => {
    expectTypeOf<CommitPulseSectionProps['showCommitPulse']>().not.toBeString();
    expectTypeOf<CommitPulseSectionProps['showCommitPulse']>().not.toBeNumber();

    expectTypeOf<CommitPulseSectionProps['githubUsername']>().not.toBeBoolean();
    expectTypeOf<CommitPulseSectionProps['githubUsername']>().not.toBeNumber();

    expectTypeOf<CommitPulseSectionProps['commitPulseAccent']>().not.toBeBoolean();

    // Handlers shouldn't return values
    expectTypeOf<CommitPulseSectionProps['onGithubUsernameChange']>().returns.not.toBeString();
  });
});
