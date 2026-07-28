import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NameSection } from './NameSection';

vi.mock('../SectionCard', () => ({
  SectionCard: ({
    title,
    description,
    children,
  }: {
    title: string;
    description: string;
    children: React.ReactNode;
  }) => (
    <div data-testid="section-card">
      <h2>{title}</h2>
      <p>{description}</p>
      {children}
    </div>
  ),
  FieldLabel: ({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) => (
    <label htmlFor={htmlFor}>{children}</label>
  ),
}));

describe('NameSection - Responsive Multi-device Columns & Mobile Viewport Layouts', () => {
  // Test Case 1: Fluid structural width class compliance for responsive layouts
  it('implements fluid full-width scaling on the input element to prevent layout clipping', () => {
    render(<NameSection value="John Doe" onChange={vi.fn()} />);

    const textInput = screen.getByLabelText('Display Name') as HTMLInputElement;

    expect(textInput.value).toBe('John Doe');
    expect(textInput.getAttribute('placeholder')).toBe('e.g. Omkar');
    expect(textInput.className).toContain('w-full');
  });

  // Test Case 2: Exact constraint boundary mapping for character ceilings
  it('enforces string length constraints on data entries to maintain stable visual profiles', () => {
    render(<NameSection value="" onChange={vi.fn()} />);

    const textInput = screen.getByLabelText('Display Name') as HTMLInputElement;

    expect(textInput.maxLength).toBe(100);
  });

  // Test Case 3: Proper placeholder fallback handling on empty states
  it('renders standard textual fallbacks cleanly when state parameters are unassigned', () => {
    render(<NameSection value="" onChange={vi.fn()} />);

    const previewText = screen.getByText(/Will appear as:/i);

    expect(previewText.textContent).toContain("👋 Hi, I'm Your Name");
  });

  // Test Case 4: Synchronous event handler propagation
  it('triggers update callback paths correctly upon value modification gestures', () => {
    const changeSpy = vi.fn();
    render(<NameSection value="Alex" onChange={changeSpy} />);

    const textInput = screen.getByLabelText('Display Name');
    fireEvent.change(textInput, { target: { value: 'Alexander' } });

    expect(changeSpy).toHaveBeenCalledWith('Alexander');
  });

  // Test Case 5: Verification of structural layout anchors for mobile navigation lookups
  it('preserves clean landmark identification bindings for high-level DOM targeting utilities', () => {
    const { container } = render(<NameSection value="Dev" onChange={vi.fn()} />);

    const targetSection = container.querySelector('#name-section');

    expect(targetSection).not.toBeNull();
    expect(screen.getByText('Name')).toBeDefined();
  });
});
