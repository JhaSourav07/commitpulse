import type { ComponentProps, ReactNode } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import ProfileCard from './ProfileCard';

type MotionDivProps = ComponentProps<'div'> & {
  children?: ReactNode;
};

type MotionButtonProps = ComponentProps<'button'> & {
  children?: ReactNode;
};

const shareSheetSpy = vi.fn();

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children }: MotionDivProps) => <div>{children}</div>,
    button: ({ children, onClick }: MotionButtonProps) => (
      <button onClick={onClick}>{children}</button>
    ),
  },
}));

vi.mock('./ShareSheet', () => ({
  default: (props: {
    username: string;
    isOpen: boolean;
    exportData: unknown;
    onClose: () => void;
  }) => {
    shareSheetSpy(props);

    return props.isOpen ? <div data-testid="mock-share-sheet">Mock ShareSheet</div> : null;
  },
}));

const mockUser = {
  name: 'Mayank Rawat',
  username: 'mayank200529',
  bio: 'Open Source Contributor',
  location: 'Jaipur',
  joinedDate: '2024',
  developerScore: 95,
  avatarUrl: 'https://example.com/avatar.png',
  isPro: false,
  stats: {
    repositories: 10,
    stars: 50,
    followers: 100,
    following: 20,
  },
};

const mockExportData = {
  username: 'mayank200529',
} as never;

describe('ProfileCard Mock Integrations', () => {
  beforeEach(() => {
    shareSheetSpy.mockClear();
  });

  it('renders with ShareSheet initially closed', () => {
    render(<ProfileCard user={mockUser} exportData={mockExportData} />);

    expect(screen.queryByTestId('mock-share-sheet')).toBeNull();
  });

  it('opens ShareSheet after clicking Share Your Pulse', () => {
    render(<ProfileCard user={mockUser} exportData={mockExportData} />);

    fireEvent.click(screen.getByText('Share Your Pulse'));

    expect(screen.getByTestId('mock-share-sheet')).toBeTruthy();
  });

  it('passes the correct username to ShareSheet', () => {
    render(<ProfileCard user={mockUser} exportData={mockExportData} />);

    const latestCall = shareSheetSpy.mock.calls[shareSheetSpy.mock.calls.length - 1][0];

    expect(latestCall.username).toBe('mayank200529');
  });

  it('passes exportData to ShareSheet', () => {
    render(<ProfileCard user={mockUser} exportData={mockExportData} />);

    const latestCall = shareSheetSpy.mock.calls[shareSheetSpy.mock.calls.length - 1][0];

    expect(latestCall.exportData).toBe(mockExportData);
  });

  it('updates ShareSheet isOpen prop after share button click', () => {
    render(<ProfileCard user={mockUser} exportData={mockExportData} />);

    fireEvent.click(screen.getByText('Share Your Pulse'));

    const latestCall = shareSheetSpy.mock.calls[shareSheetSpy.mock.calls.length - 1][0];

    expect(latestCall.isOpen).toBe(true);
  });
});
