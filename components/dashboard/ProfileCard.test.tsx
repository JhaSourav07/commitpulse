import type { ComponentProps, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import ProfileCard from './ProfileCard';

type MotionDivProps = ComponentProps<'div'> & {
  children?: ReactNode;
};

type MotionButtonProps = ComponentProps<'button'> & {
  children?: ReactNode;
};

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children }: MotionDivProps) => <div>{children}</div>,
    button: ({ children, onClick }: MotionButtonProps) => (
      <button onClick={onClick}>{children}</button>
    ),
  },
}));

vi.mock('./ShareSheet', () => ({
  default: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div>Mock ShareSheet</div> : null),
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

describe('ProfileCard', () => {
  it('renders user name', () => {
    render(<ProfileCard user={mockUser} exportData={mockExportData} />);
    expect(screen.getByText('Mayank Rawat')).toBeTruthy();
  });

  it('renders username with @ prefix', () => {
    render(<ProfileCard user={mockUser} exportData={mockExportData} />);
    expect(screen.getByText('@mayank200529')).toBeTruthy();
  });

  it('renders bio', () => {
    render(<ProfileCard user={mockUser} exportData={mockExportData} />);
    expect(screen.getByText('Open Source Contributor')).toBeTruthy();
  });

  it('renders location', () => {
    render(<ProfileCard user={mockUser} exportData={mockExportData} />);
    expect(screen.getByText('Jaipur')).toBeTruthy();
  });

  it('renders developer score', () => {
    render(<ProfileCard user={mockUser} exportData={mockExportData} />);
    expect(screen.getByText('95')).toBeTruthy();
  });

  it('renders Share Your Pulse button', () => {
    render(<ProfileCard user={mockUser} exportData={mockExportData} />);
    expect(screen.getByText('Share Your Pulse')).toBeTruthy();
  });

  it('shows ShareSheet when share button is clicked', () => {
    render(<ProfileCard user={mockUser} exportData={mockExportData} />);

    fireEvent.click(screen.getByText('Share Your Pulse'));

    expect(screen.getByText('Mock ShareSheet')).toBeTruthy();
  });
});
