import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { DescriptionSection } from './DescriptionSection';

vi.mock('../SectionCard', () => ({
  SectionCard: ({
    children,
    title,
  }: {
    children: React.ReactNode;
    title: string;
    description?: string;
    defaultOpen?: boolean;
  }) => (
    <div data-testid="section-card">
      <span data-testid="section-title">{title}</span>
      {children}
    </div>
  ),
  FieldLabel: ({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) => (
    <label htmlFor={htmlFor}>{children}</label>
  ),
}));

describe('DescriptionSection - Edge Cases & Empty/Missing Inputs Verification', () => {
  it('renders without runtime errors when value is an empty string', () => {
    expect(() => render(<DescriptionSection value="" onChange={vi.fn()} />)).not.toThrow();
  });

  it('shows 280 characters remaining when value is empty', () => {
    render(<DescriptionSection value="" onChange={vi.fn()} />);

    expect(screen.getByText('280 characters remaining')).toBeInTheDocument();
  });

  it('displays placeholder text and empty value in the empty state', () => {
    render(<DescriptionSection value="" onChange={vi.fn()} />);

    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute(
      'placeholder',
      'e.g. Full-stack developer passionate about building great products. Open source enthusiast. Coffee addict.'
    );
    expect(textarea).toHaveValue('');
  });

  it('maintains non-amber gray counter style in empty state since remaining 280 is well above the 40-character near-limit threshold', () => {
    render(<DescriptionSection value="" onChange={vi.fn()} />);

    const counter = screen.getByText('280 characters remaining');
    expect(counter).toHaveClass('text-gray-400');
    expect(counter).not.toHaveClass('text-amber-500');
  });

  it('renders all key DOM structures correctly in the empty layout state', () => {
    render(<DescriptionSection value="" onChange={vi.fn()} />);

    expect(screen.getByTestId('section-card')).toBeInTheDocument();
    expect(screen.getByTestId('section-title')).toHaveTextContent('Description');
    expect(screen.getByText('Bio / Tagline')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveAttribute('id', 'editor-bio');
    expect(screen.getByText('280 characters remaining')).toBeInTheDocument();
  });
});
