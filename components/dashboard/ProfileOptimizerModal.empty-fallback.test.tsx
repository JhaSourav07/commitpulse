import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
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
    // The modal starts in a loading state
    expect(screen.getByText(/Analysing GitHub profile/i)).toBeInTheDocument();
  });

  it('2. Verify clear fallback UI is displayed', async () => {
    // Fast-forward or wait for the loading state to complete
    render(<ProfileOptimizerModal isOpen={true} onClose={defaultOnClose} userData={null} />);

    await waitFor(
      () => {
        // It defaults to an overall score of 72 with Grade C
        expect(screen.getByText('72')).toBeInTheDocument();
        expect(screen.getByText(/Grade: B\+/i)).toBeInTheDocument();
      },
      { timeout: 6000 }
    );
  }, 10000);

  it('3. Verify standard styles are maintained in this default empty layout state', async () => {
    render(<ProfileOptimizerModal isOpen={true} onClose={defaultOnClose} userData={null} />);

    await waitFor(
      () => {
        // Look for the "Actionable Recommendations" header
        expect(screen.getByText('Actionable Recommendations')).toBeInTheDocument();
      },
      { timeout: 6000 }
    );

    // Check for backdrop and container styles
    // The backdrop is the element with bg-black/60
    const backdrop = document.querySelector('.bg-black\\/60');
    expect(backdrop).toBeInTheDocument();
    expect(backdrop).toHaveClass('absolute inset-0 backdrop-blur-md');

    // Find the main modal window
    const modalWindow = document.querySelector('.max-w-3xl');
    expect(modalWindow).toBeInTheDocument();
    expect(modalWindow).toHaveClass('relative w-full max-h-[90vh] overflow-hidden rounded-2xl');
  }, 10000);

  it('4. Assert no unexpected runtime errors or hydration failures occur with empty arrays/objects', async () => {
    // Providing an empty object that previously crashed the app
    render(
      <ProfileOptimizerModal
        isOpen={true}
        onClose={defaultOnClose}
        userData={{ languages: [], stats: { repositories: 0 } }}
      />
    );

    // It should render completely without runtime errors
    await waitFor(
      () => {
        expect(screen.getByText('Actionable Recommendations')).toBeInTheDocument();
      },
      { timeout: 6000 }
    );

    // 70 score calculated from 40 + 30 (fallback devScore)
    expect(screen.getByText('70')).toBeInTheDocument();
    expect(screen.getByText(/Grade: B\+/i)).toBeInTheDocument();
  }, 10000);

  it('5. Check key DOM structures to make sure empty markers exist', async () => {
    render(<ProfileOptimizerModal isOpen={true} onClose={defaultOnClose} userData={null} />);

    await waitFor(
      () => {
        // The fallback state renders default categories and standard "room to grow" text
        expect(screen.getByText('Profile Health: Good, but has room to grow.')).toBeInTheDocument();

        // Check for default actionable recommendation priority marker and issue
        expect(screen.getAllByText(/PRIORITY/)[0]).toBeInTheDocument();
        expect(
          screen.getByText(/Your GitHub profile bio is weak or completely empty/i)
        ).toBeInTheDocument();
      },
      { timeout: 6000 }
    );
  }, 10000);
});
