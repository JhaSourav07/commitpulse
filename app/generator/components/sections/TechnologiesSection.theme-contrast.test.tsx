import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TechnologiesSection } from './TechnologiesSection';
import React from 'react';

describe('TechnologiesSection Theme Contrast & Visual Cohesion', () => {
  const defaultProps = {
    selected: ['react'],
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    document.documentElement.className = '';
  });

  afterEach(() => {
    document.documentElement.className = '';
  });

  it('renders correctly in light theme with proper structure', () => {
    document.documentElement.className = 'light';

    render(<TechnologiesSection {...defaultProps} />);

    expect(screen.getByText('Technologies')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search technologies...')).toBeInTheDocument();
    expect(screen.getByText(/Select your tech stack/i)).toBeInTheDocument();
  });

  it('renders correctly in dark theme with proper structure', () => {
    document.documentElement.className = 'dark';

    render(<TechnologiesSection {...defaultProps} />);

    expect(screen.getByText('Technologies')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search technologies...')).toBeInTheDocument();
    expect(screen.getByText(/Select your tech stack/i)).toBeInTheDocument();
  });

  it('ensures text remains visible in light mode (contrast proxy check)', () => {
    document.documentElement.className = 'light';

    render(<TechnologiesSection {...defaultProps} />);

    expect(screen.getByText('Technologies')).toBeVisible();
    const techCountEl = screen.getAllByText((content) =>
      content.toLowerCase().includes('technologies')
    )[0];
    expect(techCountEl).toBeVisible();
    expect(screen.getByText(/Selected \(1\)/i)).toBeVisible();
  });

  it('ensures text remains visible in dark mode (contrast proxy check)', () => {
    document.documentElement.className = 'dark';

    render(<TechnologiesSection {...defaultProps} />);

    expect(screen.getByText('Technologies')).toBeVisible();
    const techCountEl = screen.getAllByText((content) =>
      content.toLowerCase().includes('technologies')
    )[0];
    expect(techCountEl).toBeVisible();
    expect(screen.getByText(/Selected \(1\)/i)).toBeVisible();
  });

  it('maintains UI stability when filtering technologies in dark mode', () => {
    document.documentElement.className = 'dark';

    render(<TechnologiesSection {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search technologies...');

    fireEvent.change(searchInput, {
      target: { value: 'react' },
    });

    expect(searchInput).toBeInTheDocument();
    const techCountEls = screen.getAllByText((content) =>
      content.toLowerCase().includes('technologies')
    );
    expect(techCountEls.length).toBeGreaterThan(0);
  });
});
