import '@testing-library/jest-dom';

import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode, SVGProps } from 'react';

import CommitClock from './CommitClock';
import type { CommitClockData } from '@/types/dashboard';

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, className }: { children: ReactNode; className?: string }) => (
      <div className={className}>{children}</div>
    ),

    g: ({
      children,
      ...props
    }: SVGProps<SVGGElement> & {
      children: ReactNode;
    }) => <g {...props}>{children}</g>,
  },
}));

vi.mock('./VisualizationTooltip', () => ({
  default: ({ title, children }: { title: string; children: ReactNode }) => (
    <div data-testid="tooltip">
      <div>{title}</div>
      {children}
    </div>
  ),
}));

const data: CommitClockData[] = [
  { day: 'Sun', commits: 2 },
  { day: 'Mon', commits: 6 },
  { day: 'Tue', commits: 3 },
  { day: 'Wed', commits: 8 },
  { day: 'Thu', commits: 4 },
  { day: 'Fri', commits: 5 },
  { day: 'Sat', commits: 1 },
];

beforeEach(() => {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
    left: 100,
    top: 100,
    width: 50,
    height: 50,
    right: 150,
    bottom: 150,
    x: 100,
    y: 100,
    toJSON: () => {},
  } as DOMRect);
});

describe('CommitClock mouse interactivity', () => {
  it('shows tooltip on mouse enter', () => {
    render(<CommitClock data={data} />);

    const node = screen.getByLabelText(/Sun:/i);

    fireEvent.mouseEnter(node);

    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
  });

  it('updates tooltip on mouse move', () => {
    render(<CommitClock data={data} />);

    const node = screen.getByLabelText(/Mon:/i);

    fireEvent.mouseMove(node);

    expect(screen.getByTestId('tooltip')).toHaveTextContent('Mon activity');
  });

  it('hides tooltip on mouse leave', () => {
    render(<CommitClock data={data} />);

    const node = screen.getByLabelText(/Tue:/i);

    fireEvent.mouseEnter(node);

    expect(screen.getByTestId('tooltip')).toBeInTheDocument();

    fireEvent.mouseLeave(node);

    expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument();
  });

  it('applies cursor-pointer class', () => {
    render(<CommitClock data={data} />);

    const node = screen.getByLabelText(/Wed:/i);

    expect(node).toHaveClass('cursor-pointer');
  });

  it('shows and hides tooltip on focus and blur', () => {
    render(<CommitClock data={data} />);

    const node = screen.getByLabelText(/Thu:/i);

    fireEvent.focus(node);

    expect(screen.getByTestId('tooltip')).toBeInTheDocument();

    fireEvent.blur(node);

    expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument();
  });
});
