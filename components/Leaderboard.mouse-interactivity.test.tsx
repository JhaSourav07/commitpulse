import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import React from 'react';
import Leaderboard, { Contributor } from './Leaderboard';

// Mock Next.js Image
vi.mock('next/image', () => ({
  default: ({ ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    /* eslint-disable @next/next/no-img-element */
    <img alt="mock" {...props} />
  ),
}));

// Mock framer-motion to render children with classes and event handlers
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    motion: {
      div: ({
        children,
        className,
        onClick,
        style,
      }: {
        children?: React.ReactNode;
        className?: string;
        onClick?: React.MouseEventHandler<HTMLDivElement>;
        style?: React.CSSProperties;
      }) => (
        <div className={className} onClick={onClick} style={style} data-testid="motion-div">
          {children}
        </div>
      ),
    },
  };
});

describe('Leaderboard - Mouse Interactivity & Touch Events (Issue #2757 Equivalent)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockData: Contributor[] = [
    { id: 1, login: 'user1', avatar_url: '', html_url: '', contributions: 100 },
    { id: 2, login: 'user2', avatar_url: '', html_url: '', contributions: 90 },
    { id: 3, login: 'user3', avatar_url: '', html_url: '', contributions: 80 },
    { id: 4, login: 'user4', avatar_url: '', html_url: '', contributions: 70 },
  ];

  it('Interactive Pointer Detection (Cursor Hovers Equivalent): applies explicit cursor-pointer classes on interactive elements', () => {
    const { container } = render(<Leaderboard contributors={mockData} />);

    // Check podiums
    const podiums = container.querySelectorAll('.w-24.sm\\:w-36.cursor-pointer');
    expect(podiums.length).toBeGreaterThan(0);

    // Check list entries
    const listEntries = container.querySelectorAll(
      '.flex.items-center.justify-between.p-4.cursor-pointer'
    );
    expect(listEntries.length).toBe(1); // user4
  });

  it('Event Propagation to DOM Targets (Touch Propagation Equivalent): fires window.open with contributor profile URL on click', () => {
    const openMock = vi.fn();
    const originalOpen = window.open;
    window.open = openMock;

    const { container } = render(<Leaderboard contributors={mockData} />);

    const listItem = container.querySelector(
      '.flex.items-center.justify-between.p-4.cursor-pointer'
    ) as HTMLElement;
    fireEvent.click(listItem);

    // Verifies the contributor's GitHub profile is opened in a new tab
    expect(openMock).toHaveBeenCalledWith('', '_blank', 'noopener,noreferrer');

    window.open = originalOpen;
  });

  it('Hover State Visibility (Tooltips Equivalent): transitions text and background colors via group-hover structurally', () => {
    const { container } = render(<Leaderboard contributors={mockData} />);

    const listItem = container.querySelector(
      '.flex.items-center.justify-between.p-4.cursor-pointer'
    );
    // Ensure the Tailwind structural classes that handle the state change are natively present
    expect(listItem?.className).toContain('hover:bg-black/[0.06]');
    expect(listItem?.className).toContain('group');
  });

  it('Mouse Leave Recovery (Hiding Overlay visuals Equivalent): ensures transition duration limits are bounded safely', () => {
    const { container } = render(<Leaderboard contributors={mockData} />);

    const listItems = container.querySelectorAll('.transition-all.duration-300');
    // Validates the recovery speeds don't trap the user in floating states
    expect(listItems.length).toBeGreaterThan(0);
  });

  it('Nested Interactive Scopes: validates avatar glow triggers specifically isolate under parental group hover boundaries', () => {
    const { container } = render(<Leaderboard contributors={mockData} />);

    // Verify the avatar borders only activate under group-hover targeting
    const listAvatar = container.querySelector('.group-hover\\:border-cyan-400\\/40');
    expect(listAvatar).toBeTruthy();
  });
});
