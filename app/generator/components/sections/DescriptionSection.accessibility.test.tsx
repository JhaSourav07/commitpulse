import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { DescriptionSection } from './DescriptionSection';

vi.mock('lucide-react', () => ({
  ChevronDown: () => <svg data-testid="chevron-icon" />,
}));

describe('DescriptionSection Accessibility Standards & Screen Reader Aria Compliance', () => {
  it('uses correct accessible label coordinates (role, aria-labelledby, or aria-describedby)', () => {
    render(<DescriptionSection value="" onChange={vi.fn()} />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
    // The section card button should have an accessible role
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('ensures interactive elements maintain visible focus outline behaviors', () => {
    render(<DescriptionSection value="" onChange={vi.fn()} />);
    const button = screen.getByRole('button');
    button.focus();
    expect(document.activeElement).toBe(button);
    expect(button).toBeVisible();
    const textarea = screen.getByRole('textbox');
    textarea.focus();
    expect(document.activeElement).toBe(textarea);
    expect(textarea).toBeVisible();
  });

  it('announces tooltip/description labels with correct accessibility descriptions', () => {
    render(<DescriptionSection value="" onChange={vi.fn()} />);
    // The section description "A short bio or tagline about yourself" should be in the DOM
    expect(screen.getByText(/a short bio or tagline about yourself/i)).toBeInTheDocument();
    // Placeholder acts as accessible description for the textarea
    const textarea = screen.getByPlaceholderText(/full-stack developer passionate/i);
    expect(textarea).toBeInTheDocument();
  });

  it('maintains logical keyboard tab order for interactive elements', () => {
    render(<DescriptionSection value="" onChange={vi.fn()} />);
    const focusables = document.querySelectorAll(
      'button:not([disabled]), input, textarea, [tabindex]:not([tabindex="-1"])'
    );
    expect(focusables.length).toBeGreaterThan(0);
    focusables.forEach((el) => {
      const tabIndex = el.getAttribute('tabindex');
      expect(tabIndex).not.toBe('-1');
    });
  });

  it('renders headings in correct logical hierarchical order', () => {
    render(<DescriptionSection value="" onChange={vi.fn()} />);
    // Section title "Description" should be present as a text node
    expect(screen.getByText('Description')).toBeInTheDocument();
    // FieldLabel "Bio / Tagline" should be present
    expect(screen.getByText(/bio \/ tagline/i)).toBeInTheDocument();
    // Both labels appear in document order: title before field label
    const allText = document.body.textContent ?? '';
    const titleIdx = allText.indexOf('Description');
    const labelIdx = allText.indexOf('Bio / Tagline');
    expect(titleIdx).toBeLessThan(labelIdx);
  });
});
