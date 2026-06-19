import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SectionLabel } from './SectionLabel';

describe('SectionLabel Empty/Missing Inputs Verification', () => {
  it('renders safely with empty string children', () => {
    const { container } = render(<SectionLabel>{''}</SectionLabel>);

    const label = container.querySelector('p');

    expect(label).toBeInTheDocument();
    expect(label?.textContent).toBe('');
  });

  it('renders safely with whitespace-only children', () => {
    const { container } = render(<SectionLabel>{'   '}</SectionLabel>);

    const label = container.querySelector('p');

    expect(label).toBeInTheDocument();
    expect(label?.textContent).toBe('   ');
  });

  it('renders safely with null children', () => {
    const { container } = render(<SectionLabel>{null}</SectionLabel>);

    const label = container.querySelector('p');

    expect(label).toBeInTheDocument();
    expect(label?.textContent).toBe('');
  });

  it('renders safely with undefined children', () => {
    const { container } = render(<SectionLabel>{undefined}</SectionLabel>);

    const label = container.querySelector('p');

    expect(label).toBeInTheDocument();
    expect(label?.textContent).toBe('');
  });

  it('preserves default styling classes when children are missing', () => {
    const { container } = render(<SectionLabel>{null}</SectionLabel>);

    const label = container.querySelector('p');

    expect(label).toBeInTheDocument();
    expect(label).toHaveClass(
      'text-[10px]',
      'font-bold',
      'uppercase',
      'tracking-[0.22em]',
      'text-gray-600',
      'dark:text-white/60',
      'mb-2'
    );
  });
});
