import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SectionLabel } from './SectionLabel';

describe('SectionLabel Massive Data Sets and Extreme High Bounds Scaling', () => {
  it('renders labels containing thousands of characters without truncation or crashes', () => {
    const largeLabel = 'A'.repeat(10000);

    render(<SectionLabel>{largeLabel}</SectionLabel>);

    expect(screen.getByText(largeLabel)).toBeInTheDocument();
  });

  it('renders extremely long unbroken strings while preserving content integrity', () => {
    const longToken = 'CommitPulse'.repeat(2000);

    render(<SectionLabel>{longToken}</SectionLabel>);

    expect(screen.getByText(longToken)).toBeInTheDocument();
  });

  it('renders a large number of SectionLabel instances simultaneously', () => {
    const labels = Array.from({ length: 1000 }, (_, index) => (
      <SectionLabel key={index}>{`Label ${index}`}</SectionLabel>
    ));

    render(<>{labels}</>);

    expect(screen.getByText('Label 0')).toBeInTheDocument();
    expect(screen.getByText('Label 500')).toBeInTheDocument();
    expect(screen.getByText('Label 999')).toBeInTheDocument();

    expect(screen.getAllByText(/^Label \d+$/)).toHaveLength(1000);
  });

  it('preserves styling classes when rendering massive content payloads', () => {
    const largeLabel = 'Scale'.repeat(3000);

    render(<SectionLabel>{largeLabel}</SectionLabel>);

    const label = screen.getByText(largeLabel);

    expect(label.tagName).toBe('P');
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

  it('supports repeated rerenders with large content without DOM corruption', () => {
    const { rerender } = render(<SectionLabel>{'First'.repeat(2000)}</SectionLabel>);

    rerender(<SectionLabel>{'Second'.repeat(2000)}</SectionLabel>);
    rerender(<SectionLabel>{'Third'.repeat(2000)}</SectionLabel>);

    expect(screen.getByText('Third'.repeat(2000))).toBeInTheDocument();
    expect(screen.queryByText('First'.repeat(2000))).not.toBeInTheDocument();
    expect(screen.queryByText('Second'.repeat(2000))).not.toBeInTheDocument();
  });
});
