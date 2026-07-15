import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { TechnologyGraph } from './TechnologyGraph';

describe('TechnologyGraph Accessibility', () => {
  const defaultProps = {
    selected: [],
    onToggle: vi.fn(),
  };

  it('renders graph heading', () => {
    render(<TechnologyGraph {...defaultProps} />);

    expect(screen.getByText('Technology Dependency Graph')).toBeInTheDocument();
  });

  it('renders zoom in button', () => {
    render(<TechnologyGraph {...defaultProps} />);

    expect(screen.getByTitle('Zoom In')).toBeInTheDocument();
  });

  it('renders zoom out button', () => {
    render(<TechnologyGraph {...defaultProps} />);

    expect(screen.getByTitle('Zoom Out')).toBeInTheDocument();
  });

  it('renders reset graph button', () => {
    render(<TechnologyGraph {...defaultProps} />);

    expect(screen.getByTitle('Reset Graph Layout')).toBeInTheDocument();
  });

  it('supports keyboard focus', async () => {
    const user = userEvent.setup();

    render(<TechnologyGraph {...defaultProps} />);

    await user.tab();

    expect(screen.getByTitle('Zoom In')).toHaveFocus();
  });

  it('supports keyboard focus on SVG nodes', async () => {
    const user = userEvent.setup();

    render(<TechnologyGraph {...defaultProps} />);

    // Tab past toolbar buttons to reach first node
    await user.tab(); // Zoom In
    await user.tab(); // Zoom Out
    await user.tab(); // Reset Graph Layout
    await user.tab(); // First SVG node

    const buttons = screen.getAllByRole('button');
    const nodeButtons = buttons.filter(
      (btn) => btn.getAttribute('aria-label') && btn.getAttribute('aria-label') !== 'Zoom In'
    );
    expect(nodeButtons[0]).toHaveFocus();
  });

  it('toggles technology selection using Enter key', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<TechnologyGraph {...defaultProps} onToggle={onToggle} />);

    const reactButton = screen.getByRole('button', { name: /React \(Frontend\)/i });
    reactButton.focus();

    await user.keyboard('{Enter}');
    expect(onToggle).toHaveBeenCalledWith('react');
  });

  it('toggles technology selection using Space key', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<TechnologyGraph {...defaultProps} onToggle={onToggle} />);

    const nextjsButton = screen.getByRole('button', { name: /Next\.js \(Frontend\)/i });
    nextjsButton.focus();

    await user.keyboard(' ');
    expect(onToggle).toHaveBeenCalledWith('nextjs');
  });

  it('renders SVG nodes with correct ARIA roles and labels', () => {
    render(<TechnologyGraph {...defaultProps} selected={['react']} />);

    const reactButton = screen.getByRole('button', { name: /React \(Frontend\)/i });
    expect(reactButton).toHaveAttribute('aria-pressed', 'true');
    expect(reactButton).toHaveAttribute('tabindex', '0');

    const nextjsButton = screen.getByRole('button', { name: /Next\.js \(Frontend\)/i });
    expect(nextjsButton).toHaveAttribute('aria-pressed', 'false');
  });
});
