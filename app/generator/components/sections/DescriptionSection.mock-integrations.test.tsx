import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DescriptionSection } from './DescriptionSection';

vi.mock('../SectionCard', () => ({
  SectionCard: ({
    children,
    title,
    description,
    defaultOpen,
  }: {
    children: React.ReactNode;
    title: string;
    description?: string;
    defaultOpen?: boolean;
  }) => (
    <div data-testid="mock-section-card">
      <span data-testid="section-title">{title}</span>
      <span data-testid="section-description">{description}</span>
      <span data-testid="default-open">{String(defaultOpen)}</span>
      {children}
    </div>
  ),

  FieldLabel: ({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) => (
    <label data-testid="mock-field-label" htmlFor={htmlFor}>
      {children}
    </label>
  ),
}));

describe('DescriptionSection - Mock Integrations & Isolated Component Behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with mocked SectionCard integration', () => {
    render(<DescriptionSection value="" onChange={vi.fn()} />);

    expect(screen.getByTestId('mock-section-card')).toBeInTheDocument();
    expect(screen.getByTestId('section-title')).toHaveTextContent('Description');
    expect(screen.getByTestId('section-description')).toHaveTextContent(
      'A short bio or tagline about yourself'
    );
    expect(screen.getByTestId('default-open')).toHaveTextContent('true');
  });

  it('passes correct editor id through FieldLabel integration', () => {
    render(<DescriptionSection value="" onChange={vi.fn()} />);

    const label = screen.getByTestId('mock-field-label');

    expect(label).toHaveAttribute('for', 'editor-bio');
    expect(label).toHaveTextContent('Bio / Tagline');
  });

  it('uses the provided value without requiring external data sources', () => {
    render(<DescriptionSection value="Frontend developer" onChange={vi.fn()} />);

    const textarea = screen.getByRole('textbox');

    expect(textarea).toHaveValue('Frontend developer');
    expect(screen.getByText('262 characters remaining')).toBeInTheDocument();
  });

  it('syncs user input through mocked change callback and respects character limit', () => {
    const onChange = vi.fn();

    render(<DescriptionSection value="" onChange={onChange} />);

    const textarea = screen.getByRole('textbox');

    fireEvent.change(textarea, {
      target: {
        value: 'A'.repeat(400),
      },
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('A'.repeat(280));
  });

  it('keeps mocked integrations stable during value updates', () => {
    const onChange = vi.fn();

    const { rerender } = render(<DescriptionSection value="First value" onChange={onChange} />);

    expect(screen.getByText('269 characters remaining')).toBeInTheDocument();

    rerender(<DescriptionSection value="Updated description" onChange={onChange} />);

    expect(screen.getByRole('textbox')).toHaveValue('Updated description');
    expect(screen.getByText('261 characters remaining')).toBeInTheDocument();
  });
});
