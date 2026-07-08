import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { DescriptionSection } from './DescriptionSection';

describe('DescriptionSection Error Resilience', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders safely when value is undefined and falls back to an empty string', () => {
    render(<DescriptionSection value={undefined as unknown as string} onChange={vi.fn()} />);

    const textarea = screen.getByRole('textbox');

    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue('');
    expect(screen.getByText('280 characters remaining')).toBeInTheDocument();
  });

  it('renders safely when value is null and preserves fallback UI', () => {
    render(<DescriptionSection value={null as unknown as string} onChange={vi.fn()} />);

    const textarea = screen.getByRole('textbox');

    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue('');
    expect(screen.getByText('280 characters remaining')).toBeInTheDocument();
  });

  it('caps extremely large user input at the 280 character limit', () => {
    const onChange = vi.fn();

    render(<DescriptionSection value="" onChange={onChange} />);

    const textarea = screen.getByRole('textbox');

    const hugeInput = 'A'.repeat(5000);

    fireEvent.change(textarea, {
      target: {
        value: hugeInput,
      },
    });

    expect(onChange).toHaveBeenCalledTimes(1);

    const receivedValue = onChange.mock.calls[0][0];

    expect(receivedValue).toHaveLength(280);
    expect(receivedValue).toBe(hugeInput.slice(0, 280));
  });

  it('remains stable across rapid rerenders with different values', () => {
    const { rerender } = render(<DescriptionSection value="" onChange={vi.fn()} />);

    rerender(<DescriptionSection value="hello" onChange={vi.fn()} />);

    rerender(<DescriptionSection value="open source" onChange={vi.fn()} />);

    rerender(<DescriptionSection value={'A'.repeat(280)} onChange={vi.fn()} />);

    rerender(<DescriptionSection value="" onChange={vi.fn()} />);

    const textarea = screen.getByRole('textbox');

    expect(textarea).toBeInTheDocument();
    expect(screen.getByText('280 characters remaining')).toBeInTheDocument();
  });

  it('handles an exact 280 character value without breaking the counter', () => {
    const exactLimit = 'A'.repeat(280);

    render(<DescriptionSection value={exactLimit} onChange={vi.fn()} />);

    const textarea = screen.getByRole('textbox');

    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue(exactLimit);

    expect(screen.getByText('0 characters remaining')).toBeInTheDocument();
  });
});
