import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DescriptionSection } from './DescriptionSection';
import React from 'react';

describe('DescriptionSection Theme Contrast & Visual Cohesion', () => {
  const defaultProps = {
    value: '',
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

    render(<DescriptionSection {...defaultProps} />);

    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText(/Bio \/ Tagline/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Full-stack developer/i)).toBeInTheDocument();
  });

  it('renders correctly in dark theme with proper structure', () => {
    document.documentElement.className = 'dark';

    render(<DescriptionSection {...defaultProps} />);

    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText(/Bio \/ Tagline/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Full-stack developer/i)).toBeInTheDocument();
  });

  it('ensures text remains visible in light mode (contrast proxy check)', () => {
    document.documentElement.className = 'light';

    render(<DescriptionSection {...defaultProps} value="Testing description" />);

    expect(screen.getByText('Description')).toBeVisible();
    expect(screen.getByText(/characters remaining/i)).toBeVisible();
  });

  it('ensures text remains visible in dark mode (contrast proxy check)', () => {
    document.documentElement.className = 'dark';

    render(<DescriptionSection {...defaultProps} value="Testing description" />);

    expect(screen.getByText('Description')).toBeVisible();
    expect(screen.getByText(/characters remaining/i)).toBeVisible();
  });

  it('maintains UI stability when description content changes', () => {
    const onChange = vi.fn();

    render(<DescriptionSection value="" onChange={onChange} />);

    const textarea = screen.getByPlaceholderText(/Full-stack developer/i);

    fireEvent.change(textarea, {
      target: {
        value: 'Building awesome open source projects',
      },
    });

    expect(onChange).toHaveBeenCalled();
    expect(textarea).toBeInTheDocument();
  });
});
