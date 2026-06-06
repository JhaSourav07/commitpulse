import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SectionLabel } from './SectionLabel';

describe('SectionLabel mouse interactivity', () => {
  const renderLabel = () => {
    render(<SectionLabel>Export settings</SectionLabel>);
    return screen.getByText('Export settings');
  };

  it('keeps the label visible after mouse enter', () => {
    const label = renderLabel();

    fireEvent.mouseEnter(label);

    expect(label).toBeVisible();
  });

  it('preserves hover-safe transition-free label styling', () => {
    const label = renderLabel();

    fireEvent.mouseOver(label);

    expect(label.className).toContain('uppercase');
    expect(label.className).toContain('tracking-[0.22em]');
  });

  it('keeps the label visible after mouse leave', () => {
    const label = renderLabel();

    fireEvent.mouseEnter(label);
    fireEvent.mouseLeave(label);

    expect(label).toBeVisible();
  });

  it('does not lose rendered content after click interaction', () => {
    const label = renderLabel();

    fireEvent.click(label);

    expect(label).toHaveTextContent('Export settings');
  });

  it('supports touch event propagation without hiding content', () => {
    const label = renderLabel();

    fireEvent.touchStart(label);
    fireEvent.touchEnd(label);

    expect(label).toBeVisible();
  });
});