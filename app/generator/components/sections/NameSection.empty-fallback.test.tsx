import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NameSection } from './NameSection';
import type { HTMLAttributes, ReactNode } from 'react';

// Mock framer-motion directly to pure HTML elements with explicit display configurations
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) => (
      <div {...props}>{children}</div>
    ),
  },
}));

describe('NameSection Empty Fallback Tests', () => {
  it('renders NameSection with an empty text configuration string or null values and displays a clear fallback layout placeholder or default username', () => {
    const { rerender } = render(<NameSection value="" onChange={vi.fn()} />);
    expect(screen.getByText("👋 Hi, I'm Your Name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. Omkar')).toHaveValue('');

    rerender(<NameSection value={null as unknown as string} onChange={vi.fn()} />);
    expect(screen.getByText("👋 Hi, I'm Your Name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. Omkar')).toHaveValue('');
  });

  it('handles missing or undefined values and onChange handlers without throwing unexpected runtime layout exceptions', () => {
    const renderMissingProps = () => {
      render(
        <NameSection
          value={undefined as unknown as string}
          onChange={undefined as unknown as (v: string) => void}
        />
      );
    };

    expect(renderMissingProps).not.toThrow();
    expect(screen.getByText("👋 Hi, I'm Your Name")).toBeInTheDocument();
  });

  it('preserves baseline container styles, padding, and alignment classes in empty layout state', () => {
    render(<NameSection value="" onChange={vi.fn()} />);

    const inputElement = screen.getByPlaceholderText('e.g. Omkar');
    expect(inputElement).toHaveClass('w-full');
    expect(inputElement).toHaveClass('rounded-xl');
    expect(inputElement).toHaveClass('px-4');
    expect(inputElement).toHaveClass('py-2.5');

    const previewParagraph = screen.getByText(/Will appear as:/i);
    expect(previewParagraph).toHaveClass('mt-2');
    expect(previewParagraph).toHaveClass('text-xs');

    const previewSpan = screen.getByText("👋 Hi, I'm Your Name");
    expect(previewSpan).toHaveClass('italic');
  });

  it('mounts and unmounts the component with unconfigured fallback structures with zero runtime exceptions', () => {
    const { unmount } = render(<NameSection value="" onChange={vi.fn()} />);

    const inputElement = screen.getByPlaceholderText('e.g. Omkar');
    expect(inputElement).toBeInTheDocument();

    expect(() => unmount()).not.toThrow();
  });

  it('provides accessible placeholder strings, labels, and fallback text elements in the DOM tree', () => {
    render(<NameSection value="" onChange={vi.fn()} />);

    const label = screen.getByText('Display Name');
    expect(label).toBeInTheDocument();
    expect(label.tagName.toLowerCase()).toBe('label');
    expect(label).toHaveAttribute('for', 'editor-display-name');

    const input = screen.getByLabelText('Display Name');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('id', 'editor-display-name');
    expect(input).toHaveAttribute('placeholder', 'e.g. Omkar');

    const fallbackPreview = screen.getByText("👋 Hi, I'm Your Name");
    expect(fallbackPreview).toBeInTheDocument();
  });
});
