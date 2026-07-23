import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode, HTMLAttributes } from 'react';
import TopRivalriesTicker from './TopRivalriesTicker';
import '@testing-library/jest-dom';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) => (
      <div {...props} data-testid="motion-div">
        {children}
      </div>
    ),
  },
}));

describe('TopRivalriesTicker Mouse Interactivity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('applies pointer cursor styling to rivalry items', () => {
    const { container } = render(<TopRivalriesTicker />);

    const rivalryItems = container.querySelectorAll('.group');

    expect(rivalryItems.length).toBeGreaterThan(0);

    rivalryItems.forEach((item) => {
      expect(item).toHaveClass('cursor-pointer');
    });
  });

  it('preserves hover interaction classes for icons and labels', () => {
    const { container } = render(<TopRivalriesTicker />);

    const rivalryItem = container.querySelector('.group');
    expect(rivalryItem).toBeInTheDocument();

    expect(rivalryItem).toHaveClass('group');

    const hoverOpacityElement = container.querySelector('.group-hover\\:opacity-100');
    expect(hoverOpacityElement).toBeInTheDocument();

    const hoverTextElements = container.querySelectorAll('.group-hover\\:text-black');

    expect(hoverTextElements.length).toBeGreaterThan(0);
  });

  it('navigates correctly when the first rivalry item is clicked', () => {
    render(<TopRivalriesTicker />);

    const rivalryLabel = screen.getAllByText('Kernel vs React')[0];
    const rivalryContainer = rivalryLabel.closest('div.group');

    expect(rivalryContainer).toBeInTheDocument();

    fireEvent.click(rivalryContainer!);

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/compare?user1=torvalds&user2=gaearon');
  });

  it('propagates multiple rivalry click interactions independently', () => {
    render(<TopRivalriesTicker />);

    const kernelVsReact = screen.getAllByText('Kernel vs React')[0];
    const platformWars = screen.getAllByText('Vercel & Netlify Founders')[0];

    const firstContainer = kernelVsReact.closest('div.group');
    const secondContainer = platformWars.closest('div.group');

    expect(firstContainer).toBeInTheDocument();
    expect(secondContainer).toBeInTheDocument();

    fireEvent.click(firstContainer!);
    fireEvent.click(secondContainer!);

    expect(mockPush).toHaveBeenCalledTimes(2);

    expect(mockPush).toHaveBeenNthCalledWith(1, '/compare?user1=torvalds&user2=gaearon');

    expect(mockPush).toHaveBeenNthCalledWith(2, '/compare?user1=rauchg&user2=biilmann');
  });

  it('renders empty state safely without triggering navigation actions', () => {
    render(<TopRivalriesTicker rivalries={[]} />);

    expect(screen.getByText('No active rivalries')).toBeInTheDocument();

    fireEvent.click(screen.getByText('No active rivalries'));

    expect(mockPush).not.toHaveBeenCalled();
  });
});
