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
});
