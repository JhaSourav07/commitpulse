import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NameSection } from './NameSection';

describe('NameSection', () => {
  it('renders the section title and description', () => {
    render(<NameSection value="" onChange={vi.fn()} />);

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Your display name for the README header')).toBeInTheDocument();
  });

  it('renders the provided display name value in the input', () => {
    render(<NameSection value="Shiv" onChange={vi.fn()} />);

    expect(screen.getByPlaceholderText('e.g. Omkar')).toHaveValue('Shiv');
  });

  it('calls onChange when the user types into the input', () => {
    const onChange = vi.fn();

    render(<NameSection value="" onChange={onChange} />);

    fireEvent.change(screen.getByPlaceholderText('e.g. Omkar'), {
      target: { value: 'Amit' },
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('Amit');
  });

  it('renders preview text using the supplied display name', () => {
    render(<NameSection value="Shiv" onChange={vi.fn()} />);

    expect(screen.getByText("👋 Hi, I'm Shiv")).toBeInTheDocument();
  });

  it('renders fallback preview text when no display name is provided', () => {
    render(<NameSection value="" onChange={vi.fn()} />);

    expect(screen.getByText("👋 Hi, I'm Your Name")).toBeInTheDocument();
  });

  it('enforces the maximum input length constraint', () => {
    render(<NameSection value="" onChange={vi.fn()} />);

    expect(screen.getByPlaceholderText('e.g. Omkar')).toHaveAttribute('maxLength', '100');
  });
});
