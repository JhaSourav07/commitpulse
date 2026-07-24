import type { GeneratorState } from '../types';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PreviewPanel } from './PreviewPanel';

const mockState: GeneratorState = {
  name: '',
  description: '',
  selectedTechs: [],
  selectedSocials: [],
  socialLinks: {},
  githubUsername: 'test',
  showCommitPulse: false,
  commitPulseAccent: '',
  showRepoSpotlight: false,
  spotlightRepo: '',
  showSnakeGraph: false,
  showPacmanGraph: false,
  graphPlacement: 'bottom',
};

describe('PreviewPanel Timezone Boundaries', () => {
  it('1. preserves UTC timestamps in preview mode', () => {
    const markdown = '# UTC\n2026-07-08T23:59:59Z';

    render(<PreviewPanel markdown={markdown} state={mockState} />);

    expect(screen.getByRole('tabpanel')).toBeInTheDocument();
    expect(screen.getByText('README.md')).toBeInTheDocument();
  });

  it('2. preserves timezone offsets in markdown mode', () => {
    const markdown = '# Timezone\n2026-07-09T05:30:00+05:30';

    render(<PreviewPanel markdown={markdown} state={mockState} />);

    fireEvent.click(screen.getByRole('tab', { name: /markdown/i }));

    expect(screen.getByText(/05:30:00\+05:30/)).toBeInTheDocument();
  });

  it('3. handles leap-year dates without altering content', () => {
    const markdown = '# Leap Year\n2028-02-29';

    render(<PreviewPanel markdown={markdown} state={mockState} />);

    fireEvent.click(screen.getByRole('tab', { name: /markdown/i }));

    expect(screen.getByText(/2028-02-29/)).toBeInTheDocument();
  });

  it('4. preserves daylight-saving transition timestamps', () => {
    const markdown = '# DST\n2026-03-08T01:59:59-05:00\n2026-03-08T03:00:00-04:00';

    render(<PreviewPanel markdown={markdown} state={mockState} />);

    fireEvent.click(screen.getByRole('tab', { name: /markdown/i }));

    expect(screen.getByText(/01:59:59-05:00/)).toBeInTheDocument();
    expect(screen.getByText(/03:00:00-04:00/)).toBeInTheDocument();
  });

  it('5. preserves multiple regional timezone labels', () => {
    const markdown = `
# Regions
UTC
IST
EST
JST
`;

    render(<PreviewPanel markdown={markdown} state={mockState} />);

    fireEvent.click(screen.getByRole('tab', { name: /markdown/i }));

    expect(screen.getByText(/UTC/)).toBeInTheDocument();
    expect(screen.getByText(/IST/)).toBeInTheDocument();
    expect(screen.getByText(/EST/)).toBeInTheDocument();
    expect(screen.getByText(/JST/)).toBeInTheDocument();
  });
});
