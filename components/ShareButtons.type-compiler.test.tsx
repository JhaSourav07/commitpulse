import { describe, expect, expectTypeOf, it } from 'vitest';
import ShareButtons from './ShareButtons';

type ShareButtonsProps = Parameters<typeof ShareButtons>[0];

function validateShareProps(props: ShareButtonsProps) {
  return {
    valid:
      typeof props.url === 'string' &&
      (props.title === undefined || typeof props.title === 'string'),
  };
}

describe('ShareButtons type compiler validation', () => {
  it('enforces the ShareButtons prop contract', () => {
    expectTypeOf<ShareButtonsProps>().toEqualTypeOf<{
      url: string;
      title?: string;
    }>();
  });

  it('requires url to remain a string type', () => {
    expectTypeOf<ShareButtonsProps['url']>().toEqualTypeOf<string>();
  });

  it('allows title to remain optional', () => {
    expectTypeOf<ShareButtonsProps['title']>().toEqualTypeOf<string | undefined>();
  });

  it('rejects invalid prop structures at compile time', () => {
    expectTypeOf<ShareButtonsProps>().not.toEqualTypeOf<{
      url: number;
      title: number;
    }>();
  });

  it('returns strict validation reports for share button props', () => {
    const report = validateShareProps({
      url: 'https://example.com',
      title: 'Example Title',
    });

    expect(report.valid).toBe(true);
  });
});
