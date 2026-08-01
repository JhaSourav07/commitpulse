import { describe, it, expectTypeOf } from 'vitest';
import type { ComponentProps } from 'react';

import { AdvancedSettingsPanel } from './AdvancedSettingsPanel';
import type { ViewMode, DeltaFormat, Language, Timezone } from '../types';
import react from 'react';

type Props = ComponentProps<typeof AdvancedSettingsPanel>;

describe('AdvancedSettingsPanel Type Compiler Validation', () => {
  it('accepts all valid prop types', () => {
    expectTypeOf<Props['hideTitle']>().toEqualTypeOf<boolean>();
    expectTypeOf<Props['hideBackground']>().toEqualTypeOf<boolean>();
    expectTypeOf<Props['hideStats']>().toEqualTypeOf<boolean>();

    expectTypeOf<Props['viewMode']>().toEqualTypeOf<ViewMode>();
    expectTypeOf<Props['deltaFormat']>().toEqualTypeOf<DeltaFormat>();

    expectTypeOf<Props['badgeWidth']>().toEqualTypeOf<number | ''>();
    expectTypeOf<Props['badgeHeight']>().toEqualTypeOf<number | ''>();

    expectTypeOf<Props['grace']>().toEqualTypeOf<number>();

    expectTypeOf<Props['language']>().toEqualTypeOf<Language>();
    expectTypeOf<Props['timezone']>().toEqualTypeOf<Timezone>();
  });

  it('validates callback parameter types', () => {
    expectTypeOf<Props['onHideTitleChange']>().parameters.toEqualTypeOf<[boolean]>();

    expectTypeOf<Props['onHideBackgroundChange']>().parameters.toEqualTypeOf<[boolean]>();

    expectTypeOf<Props['onHideStatsChange']>().parameters.toEqualTypeOf<[boolean]>();

    expectTypeOf<Props['onViewModeChange']>().parameters.toEqualTypeOf<[ViewMode]>();

    expectTypeOf<Props['onDeltaFormatChange']>().parameters.toEqualTypeOf<[DeltaFormat]>();

    expectTypeOf<Props['onBadgeWidthChange']>().parameters.toEqualTypeOf<[number | '']>();

    expectTypeOf<Props['onBadgeHeightChange']>().parameters.toEqualTypeOf<[number | '']>();

    expectTypeOf<Props['onGraceChange']>().parameters.toEqualTypeOf<[number]>();

    expectTypeOf<Props['onLanguageChange']>().parameters.toEqualTypeOf<[Language]>();

    expectTypeOf<Props['onTimezoneChange']>().parameters.toEqualTypeOf<[Timezone]>();
  });

  it('returns void from every callback', () => {
    expectTypeOf<Props['onHideTitleChange']>().returns.toEqualTypeOf<void>();
    expectTypeOf<Props['onHideBackgroundChange']>().returns.toEqualTypeOf<void>();
    expectTypeOf<Props['onHideStatsChange']>().returns.toEqualTypeOf<void>();
    expectTypeOf<Props['onViewModeChange']>().returns.toEqualTypeOf<void>();
    expectTypeOf<Props['onDeltaFormatChange']>().returns.toEqualTypeOf<void>();
    expectTypeOf<Props['onBadgeWidthChange']>().returns.toEqualTypeOf<void>();
    expectTypeOf<Props['onBadgeHeightChange']>().returns.toEqualTypeOf<void>();
    expectTypeOf<Props['onGraceChange']>().returns.toEqualTypeOf<void>();
    expectTypeOf<Props['onLanguageChange']>().returns.toEqualTypeOf<void>();
    expectTypeOf<Props['onTimezoneChange']>().returns.toEqualTypeOf<void>();
  });

  it('allows optional empty string dimensions', () => {
    expectTypeOf<Props['badgeWidth']>().toMatchTypeOf<number | ''>();
    expectTypeOf<Props['badgeHeight']>().toMatchTypeOf<number | ''>();
  });

  it('enforces schema constraints for enums', () => {
    expectTypeOf<Props['viewMode']>().toMatchTypeOf<ViewMode>();
    expectTypeOf<Props['deltaFormat']>().toMatchTypeOf<DeltaFormat>();
    expectTypeOf<Props['language']>().toMatchTypeOf<Language>();
    expectTypeOf<Props['timezone']>().toMatchTypeOf<Timezone>();
  });
});
