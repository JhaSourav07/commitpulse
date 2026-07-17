import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { DescriptionSection } from './DescriptionSection';

describe('DescriptionSection Mouse Interactivity', () => {
  const onChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows textarea interaction through mouse click events', () => {
    render(<DescriptionSection value="" onChange={onChange} />);

    const textarea = screen.getByRole('textbox');

    fireEvent.mouseDown(textarea);
    fireEvent.mouseUp(textarea);
    fireEvent.click(textarea);

    expect(textarea).toBeInTheDocument();
    expect(textarea).toBeEnabled();
  });

  it('supports mouse-driven text entry interactions', () => {
    render(<DescriptionSection value="" onChange={onChange} />);

    const textarea = screen.getByRole('textbox');

    fireEvent.change(textarea, {
      target: {
        value: 'Building open source projects',
      },
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('Building open source projects');
  });

  it('preserves interaction state during continuous mouse events', () => {
    render(<DescriptionSection value="" onChange={onChange} />);

    const textarea = screen.getByRole('textbox');

    fireEvent.mouseEnter(textarea);
    fireEvent.mouseMove(textarea);
    fireEvent.mouseLeave(textarea);

    expect(textarea).toBeInTheDocument();
    expect(textarea).toBeEnabled();
  });

  it('supports touch interaction input on mobile devices', () => {
    render(<DescriptionSection value="" onChange={onChange} />);

    const textarea = screen.getByRole('textbox');

    fireEvent.touchStart(textarea);

    fireEvent.change(textarea, {
      target: {
        value: 'Mobile user description',
      },
    });

    fireEvent.touchEnd(textarea);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('Mobile user description');
  });

  it('maintains textarea interactivity near the character limit', () => {
    render(<DescriptionSection value="" onChange={onChange} />);

    const textarea = screen.getByRole('textbox');

    const nearLimitText = 'A'.repeat(279);

    fireEvent.change(textarea, {
      target: {
        value: nearLimitText,
      },
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(nearLimitText);
    expect(onChange.mock.calls[0][0]).toHaveLength(279);
  });
});
