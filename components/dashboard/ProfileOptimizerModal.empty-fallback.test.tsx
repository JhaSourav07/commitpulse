import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProfileOptimizerModal from './ProfileOptimizerModal';

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  X: () => <div data-testid="icon-x">X</div>,
  Download: () => <div data-testid="icon-download">Download</div>,
  Copy: () => <div data-testid="icon-copy">Copy</div>,
  CheckCircle: () => <div data-testid="icon-check-circle">CheckCircle</div>,
  TrendingUp: () => <div data-testid="icon-trending-up">TrendingUp</div>,
  AlertCircle: () => <div data-testid="icon-alert-circle">AlertCircle</div>,
}));

describe('ProfileOptimizerModal - Edge Cases & Empty/Missing Inputs Verification', () => {
  const defaultOnClose = vi.fn();

  it('1. Render with null parameters without crashing', () => {
    render(<ProfileOptimizerModal isOpen={true} onClose={defaultOnClose} userData={null} />);
    expect(screen.getByText('Profile Data Unavailable')).toBeInTheDocument();
  });

  it('2. Verify clear unavailable UI is displayed when profile data is missing', () => {
    render(<ProfileOptimizerModal isOpen={true} onClose={defaultOnClose} userData={null} />);

    expect(screen.getByText('Profile Data Unavailable')).toBeInTheDocument();
    expect(screen.queryByText('72')).not.toBeInTheDocument();
    expect(screen.queryByText(/Analysing GitHub profile/i)).not.toBeInTheDocument();
    expect(screen.getByText(/GitHub profile data is not available/i)).toBeInTheDocument();
  });

  it('3. Verify standard styles are maintained in the unavailable state', () => {
    render(<ProfileOptimizerModal isOpen={true} onClose={defaultOnClose} userData={null} />);

    expect(screen.getByText('Profile Data Unavailable')).toBeInTheDocument();

    const backdrop = document.querySelector('.bg-black\\/60');
    expect(backdrop).toBeInTheDocument();
    expect(backdrop).toHaveClass('absolute inset-0 backdrop-blur-md');

    const modalWindow = document.querySelector('.max-w-3xl');
    expect(modalWindow).toBeInTheDocument();
    expect(modalWindow).toHaveClass('relative w-full max-h-[90vh] overflow-hidden rounded-2xl');
  });

  it('4. Assert no unexpected runtime errors occur with empty arrays/objects', () => {
    render(
      <ProfileOptimizerModal
        isOpen={true}
        onClose={defaultOnClose}
        userData={{ languages: [], stats: { repositories: 0 } }}
      />
    );

    expect(screen.getByText('Profile Data Unavailable')).toBeInTheDocument();
    expect(screen.queryByText('Actionable Recommendations')).not.toBeInTheDocument();
  });

  it('5. Check copy/download stay disabled without profile data', () => {
    render(<ProfileOptimizerModal isOpen={true} onClose={defaultOnClose} userData={null} />);

    expect(screen.getByText('Profile Data Unavailable')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Copy Text/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Download Report/i })).toBeDisabled();
  });
});
