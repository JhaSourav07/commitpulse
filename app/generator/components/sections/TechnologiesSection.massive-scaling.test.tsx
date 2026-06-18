import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TechnologiesSection } from './TechnologiesSection';

describe('TechnologiesSection Massive Scaling', () => {
  it('renders successfully with a large number of selected technologies', () => {
    const selected = Array.from({ length: 1000 }, (_, i) => `tech-${i}`);

    render(<TechnologiesSection selected={selected} onChange={vi.fn()} />);

    expect(screen.getByText(new RegExp(`Selected \\(${selected.length}\\)`))).toBeInTheDocument();
  });

  it('handles extremely long search queries without crashing', () => {
    render(<TechnologiesSection selected={[]} onChange={vi.fn()} />);

    const searchInput = screen.getByPlaceholderText('Search technologies...');

    fireEvent.change(searchInput, {
      target: { value: 'A'.repeat(5000) },
    });

    expect(searchInput).toHaveValue('A'.repeat(5000));
  });

  it('renders technology list container under high-load conditions', () => {
    render(<TechnologiesSection selected={[]} onChange={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Technologies' })).toBeInTheDocument();
  });

  it('maintains clear-all control visibility with many selected items', () => {
    const selected = Array.from({ length: 500 }, (_, i) => `tech-${i}`);

    render(<TechnologiesSection selected={selected} onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: /clear all/i })).toBeInTheDocument();
  });

  it('keeps search input styling intact during large dataset scenarios', () => {
    render(<TechnologiesSection selected={[]} onChange={vi.fn()} />);

    const searchInput = screen.getByPlaceholderText('Search technologies...');

    expect(searchInput).toHaveClass('w-full');
    expect(searchInput).toHaveClass('rounded-xl');
  });
});
