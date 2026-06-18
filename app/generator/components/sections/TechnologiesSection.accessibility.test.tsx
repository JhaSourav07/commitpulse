import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TechnologiesSection } from './TechnologiesSection';
import '@testing-library/jest-dom/vitest';

describe('TechnologiesSection Accessibility', () => {
  const onChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders accessible search input with placeholder', () => {
    render(<TechnologiesSection selected={[]} onChange={onChange} />);

    const searchInput = screen.getByRole('textbox');

    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveAttribute('placeholder', 'Search technologies...');

    expect(searchInput).toBeInTheDocument();
  });

  it('renders category filter buttons accessible by role', () => {
    render(<TechnologiesSection selected={[]} onChange={onChange} />);

    const allButton = screen.getByRole('button', { name: /^all$/i });

    expect(allButton).toBeInTheDocument();
  });

  it('supports keyboard navigation to interactive controls', async () => {
    const user = userEvent.setup();

    render(<TechnologiesSection selected={[]} onChange={onChange} />);

    await user.tab();

    const focusedElement = document.activeElement;

    expect(focusedElement).not.toBe(document.body);
  });

  it('renders technologies section title and description', () => {
    render(<TechnologiesSection selected={[]} onChange={onChange} />);

    expect(screen.getByText('Technologies')).toBeInTheDocument();

    expect(screen.getByText(/select your tech stack/i)).toBeInTheDocument();
  });

  it('shows clear all button when technologies are selected', () => {
    render(<TechnologiesSection selected={['dummy']} onChange={onChange} />);

    expect(screen.getByRole('button', { name: /clear all/i })).toBeInTheDocument();
  });
});
