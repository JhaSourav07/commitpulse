import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { NameSection } from './NameSection';

describe('NameSection Accessibility', () => {
  const defaultProps = {
    value: '',
    onChange: vi.fn(),
  };

  it('renders the section toggle button with accessible name', () => {
    render(<NameSection {...defaultProps} />);

    expect(screen.getByRole('button', { name: /name/i })).toBeInTheDocument();
  });

  it('renders a textbox for entering display name', () => {
    render(<NameSection {...defaultProps} />);

    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('supports keyboard tab navigation to interactive elements', async () => {
    const user = userEvent.setup();

    render(<NameSection {...defaultProps} />);

    const toggleButton = screen.getByRole('button', { name: /name/i });

    document.body.focus();
    expect(document.body).toHaveFocus();

    await user.tab();

    expect(toggleButton).toHaveFocus();
  });

  it('provides placeholder guidance for the input field', () => {
    render(<NameSection {...defaultProps} />);

    const input = screen.getByRole('textbox');

    expect(input).toHaveAttribute('placeholder');
  });

  it('announces preview text based on entered value', () => {
    render(<NameSection value="Ajit Kumar Saini" onChange={vi.fn()} />);

    expect(screen.getByText(/will appear as:/i)).toBeInTheDocument();

    expect(screen.getByText(/hi, i.?m ajit kumar saini/i)).toBeInTheDocument();
  });
});
