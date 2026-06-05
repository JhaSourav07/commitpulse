import { describe, it, expectTypeOf } from 'vitest';
import ResumeProfileSection from './ResumeProfileSection';

describe('ResumeProfileSection TypeScript compiler validation', () => {
  it('accepts valid githubUsername prop type', () => {
    type Props = React.ComponentProps<typeof ResumeProfileSection>;

    expectTypeOf<Props>().toMatchTypeOf<{
      githubUsername: string;
    }>();
  });

  it('enforces githubUsername as required string', () => {
    type Props = React.ComponentProps<typeof ResumeProfileSection>;

    expectTypeOf<Props['githubUsername']>().toEqualTypeOf<string>();
  });

  it('does not allow githubUsername to be undefined', () => {
    type Props = React.ComponentProps<typeof ResumeProfileSection>;

    expectTypeOf<Props['githubUsername']>().not.toEqualTypeOf<string | undefined>();
  });

  it('validates component props structure', () => {
    type Props = React.ComponentProps<typeof ResumeProfileSection>;

    const validProps: Props = {
      githubUsername: 'aanyacloud',
    };

    expectTypeOf(validProps.githubUsername).toBeString();
  });

  it('supports strict prop type checking', () => {
    type Props = React.ComponentProps<typeof ResumeProfileSection>;

    expectTypeOf<Props>().toExtend<{
      githubUsername: string;
    }>();
  });

  it('supports valid string values for githubUsername', () => {
    type Props = React.ComponentProps<typeof ResumeProfileSection>;

    const props: Props = {
      githubUsername: '',
    };

    expectTypeOf(props.githubUsername).toBeString();
  });
});
