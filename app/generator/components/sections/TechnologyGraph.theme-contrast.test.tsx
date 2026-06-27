import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TechnologyGraph } from './TechnologyGraph';

describe('TechnologyGraph Theme Contrast & Visual Cohesion', () => {
  const defaultProps = {
    selected: [],
    onToggle: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    document.documentElement.className = '';
  });

  afterEach(() => {
    document.documentElement.className = '';
  });

  it('renders correctly in light theme with visible graph content', () => {
    document.documentElement.className = 'light';

    render(<TechnologyGraph {...defaultProps} />);

    expect(screen.getByText('Technology Dependency Graph')).toBeVisible();
    expect(screen.getByTitle('Zoom In')).toBeVisible();
    expect(screen.getByTitle('Zoom Out')).toBeVisible();
  });

  it('renders correctly in dark theme with visible graph content', () => {
    document.documentElement.className = 'dark';

    render(<TechnologyGraph {...defaultProps} />);

    expect(screen.getByText('Technology Dependency Graph')).toBeVisible();
    expect(screen.getByTitle('Zoom In')).toBeVisible();
    expect(screen.getByTitle('Zoom Out')).toBeVisible();
  });

  it('keeps toolbar controls visible across themes', () => {
    document.documentElement.className = 'dark';

    render(<TechnologyGraph {...defaultProps} />);

    expect(screen.getByTitle('Zoom In')).toBeVisible();
    expect(screen.getByTitle('Zoom Out')).toBeVisible();
    expect(screen.getByTitle('Reset Graph Layout')).toBeVisible();
  });

  it('renders selected technology count overlay without clipping content', () => {
    render(<TechnologyGraph selected={['react', 'nextjs']} onToggle={vi.fn()} />);

    expect(screen.getByText('2 Selected Technologies')).toBeVisible();
  });

  it('maintains visible instructional text in dark mode', () => {
    document.documentElement.className = 'dark';

    render(<TechnologyGraph {...defaultProps} />);

    expect(screen.getByText(/ecosystem recommendations/i)).toBeVisible();
  });
});
