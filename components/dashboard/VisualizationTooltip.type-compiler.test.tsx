import { describe, expectTypeOf, it } from 'vitest';
import type { ComponentProps } from 'react';
import VisualizationTooltip from './VisualizationTooltip';

type VisualizationTooltipProps = ComponentProps<typeof VisualizationTooltip>;

describe('VisualizationTooltip type compiler tests', () => {
  it('validates required prop types correctly', () => {
    const props: VisualizationTooltipProps = {
      title: 'Tooltip Title',
      children: 'Tooltip Content',
      x: 100,
      y: 200,
    };

    expectTypeOf(props.title).toBeString();
    expectTypeOf(props.x).toBeNumber();
    expectTypeOf(props.y).toBeNumber();
  });

  it('ensures children accepts React-compatible content', () => {
    const props: VisualizationTooltipProps = {
      title: 'Test',
      children: 'Text Content',
      x: 0,
      y: 0,
    };

    expectTypeOf(props.children).toEqualTypeOf<VisualizationTooltipProps['children']>();
  });

  it('accepts valid numeric coordinate values safely', () => {
    const props: VisualizationTooltipProps = {
      title: 'Coordinates',
      children: 'Content',
      x: -50,
      y: 999,
    };

    expectTypeOf(props.x).toEqualTypeOf<number>();
    expectTypeOf(props.y).toEqualTypeOf<number>();
  });

  it('rejects invalid property types during compilation', () => {
    expectTypeOf<VisualizationTooltipProps>().toBeObject();

    const invalidProps: VisualizationTooltipProps = {
      title: 'Test',
      children: 'Content',
      // @ts-expect-error x must be number
      x: '100',
      y: 200,
    };
  });

  it('rejects missing required properties', () => {
    expectTypeOf<VisualizationTooltipProps>().toBeObject();

    // @ts-expect-error y is required
    const invalidProps: VisualizationTooltipProps = {
      title: 'Test',
      children: 'Content',
      x: 100,
    };
  });
});
