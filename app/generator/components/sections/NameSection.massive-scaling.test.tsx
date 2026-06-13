import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NameSection } from './NameSection';

describe('NameSection Massive Scaling', () => {
  it('renders a maximum-length display name correctly', () => {
    const longName = 'A'.repeat(100);

    render(<NameSection value={longName} onChange={vi.fn()} />);

    expect(screen.getByDisplayValue(longName)).toBeInTheDocument();
  });

  it('renders preview text with a maximum-length display name', () => {
    const longName = 'A'.repeat(100);

    render(<NameSection value={longName} onChange={vi.fn()} />);

    expect(screen.getByText(`👋 Hi, I'm ${longName}`)).toBeInTheDocument();
  });

  it('handles rapid updates without losing data', () => {
    const onChange = vi.fn();

    render(<NameSection value="" onChange={onChange} />);

    const input = screen.getByPlaceholderText('e.g. Omkar');

    fireEvent.change(input, { target: { value: 'A'.repeat(100) } });

    expect(onChange).toHaveBeenCalledWith('A'.repeat(100));
  });

  it('preserves styling classes for large values', () => {
    const longName = 'A'.repeat(100);

    render(<NameSection value={longName} onChange={vi.fn()} />);

    const input = screen.getByDisplayValue(longName);

    expect(input).toHaveClass('w-full');
    expect(input).toHaveClass('rounded-xl');
  });

  it('renders without fallback text when a large value is provided', () => {
    const longName = 'A'.repeat(100);

    render(<NameSection value={longName} onChange={vi.fn()} />);

    expect(screen.queryByText("👋 Hi, I'm Your Name")).not.toBeInTheDocument();
  });
});
