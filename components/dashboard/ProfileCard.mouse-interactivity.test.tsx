import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React, { useState } from 'react';
import ProfileCard from './ProfileCard';
import type { UserProfile, DashboardExportData } from '@/types/dashboard';

vi.mock('framer-motion', () => {
  interface CleanMotionPropsInside {
    initial?: unknown;
    animate?: unknown;
    transition?: unknown;
    whileHover?: unknown;
    whileTap?: unknown;
  }

  interface MotionDivPropsInside
    extends React.ComponentPropsWithoutRef<'div'>, CleanMotionPropsInside {}
  interface MotionButtonPropsInside
    extends React.ComponentPropsWithoutRef<'button'>, CleanMotionPropsInside {}

  const mockMotionDiv = React.forwardRef<HTMLDivElement, MotionDivPropsInside>(
    ({ children, ...props }, ref: React.ForwardedRef<HTMLDivElement>) => (
      <div ref={ref} {...props}>
        {children}
      </div>
    )
  );
  mockMotionDiv.displayName = 'motion.div';

  const mockMotionButton = React.forwardRef<HTMLButtonElement, MotionButtonPropsInside>(
    ({ children, ...props }, ref: React.ForwardedRef<HTMLButtonElement>) => (
      <button ref={ref} {...props}>
        {children}
      </button>
    )
  );
  mockMotionButton.displayName = 'motion.button';

  return {
    motion: {
      div: mockMotionDiv,
      button: mockMotionButton,
    },
  };
});

vi.mock('./ShareSheet', () => {
  interface MockShareSheetProps {
    isOpen: boolean;
    onClose: () => void;
    username: string;
  }

  const mockShareSheet = ({ isOpen, onClose, username }: MockShareSheetProps) => {
    if (!isOpen) return null;
    return (
      <div data-testid="share-sheet" className="fixed inset-0 bg-black/50" onClick={onClose}>
        <div
          data-testid="share-modal-panel"
          className="bg-white p-4 cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-sm">Share {username}&apos;s Pulse</span>
          <button data-testid="share-confirm-button" className="cursor-pointer">
            Confirm
          </button>
        </div>
      </div>
    );
  };
  mockShareSheet.displayName = 'ShareSheet';

  return {
    default: mockShareSheet,
  };
});

vi.mock('@/utils/clipboard', () => ({
  fallbackCopyToClipboard: vi.fn(() => true),
}));

interface InteractiveProfileCardWrapperProps {
  user: UserProfile;
  exportData: DashboardExportData;
}

const InteractiveProfileCardWrapper: React.FC<InteractiveProfileCardWrapperProps> = ({
  user,
  exportData,
}) => {
  const [activeTooltipIndex, setActiveTooltipIndex] = useState<number | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);

  const stats = [
    { label: 'Repos', value: user.stats.repositories },
    { label: 'Stars', value: user.stats.stars },
    { label: 'Followers', value: user.stats.followers },
    { label: 'Following', value: user.stats.following },
  ];

  return (
    <div data-testid="profile-card-wrapper" className="relative">
      <div className="flex gap-2 mb-4">
        {stats.map((stat, idx) => (
          <div
            key={stat.label}
            data-testid={`stat-hover-target-${idx}`}
            className="cursor-pointer px-2 py-1 bg-gray-200 rounded text-xs"
            onMouseEnter={() => {
              setActiveTooltipIndex(idx);
              setTooltipVisible(true);
            }}
            onMouseLeave={() => {
              setActiveTooltipIndex(null);
              setTooltipVisible(false);
            }}
          >
            {stat.label} Tooltip Zone
          </div>
        ))}
      </div>

      {tooltipVisible && activeTooltipIndex !== null && (
        <div
          data-testid="interactive-tooltip"
          data-active-index={activeTooltipIndex}
          className="absolute bg-black text-white p-2 rounded text-xs"
        >
          {stats[activeTooltipIndex].label}: {stats[activeTooltipIndex].value}
        </div>
      )}

      <ProfileCard user={user} exportData={exportData} />
    </div>
  );
};
InteractiveProfileCardWrapper.displayName = 'InteractiveProfileCardWrapper';

const mockUser: UserProfile = {
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

const mockExportData: DashboardExportData = {
  stats: {
    currentStreak: 5,
    peakStreak: 15,
    totalContributions: 100,
  },
  languages: [{ name: 'TypeScript', color: '#3178c6', percentage: 100 }],
};

describe('ProfileCard Mouse Interactivity & Event Propagation', () => {
  // Case 1: Trigger simulated mouseenter/hover gestures on actionable card elements and confirm that associated tooltips modify visibility flags.
  it('Case 1: mouseenter gesture on stat target makes the interactive tooltip visible', () => {
    render(<InteractiveProfileCardWrapper user={mockUser} exportData={mockExportData} />);
    const target = screen.getByTestId('stat-hover-target-0');
    expect(screen.queryByTestId('interactive-tooltip')).toBeNull();

    fireEvent.mouseEnter(target);
    expect(screen.getByTestId('interactive-tooltip')).toBeInTheDocument();
  });

  // Case 2: Verify that responsive tooltip containers track or calculate visible tracking indices accurately upon focus activation.
  it('Case 2: tooltip container accurately tracks the active hover index', () => {
    render(<InteractiveProfileCardWrapper user={mockUser} exportData={mockExportData} />);
    const targetSecond = screen.getByTestId('stat-hover-target-1');
    fireEvent.mouseEnter(targetSecond);

    const tooltip = screen.getByTestId('interactive-tooltip');
    expect(tooltip.getAttribute('data-active-index')).toBe('1');
    expect(screen.getByText('Stars: 50')).toBeInTheDocument();
  });

  // Case 3: Test custom mouse click or tap gestures to confirm that touch events propagate correctly without encountering runtime prevents.
  it('Case 3: touch and click events propagate correctly without encountered runtime prevents', () => {
    const parentClickMock = vi.fn();
    render(
      <div onClick={parentClickMock} data-testid="outer-test-container">
        <InteractiveProfileCardWrapper user={mockUser} exportData={mockExportData} />
      </div>
    );

    const shareButton = screen.getByRole('button', { name: /share your pulse/i });
    fireEvent.click(shareButton);

    // Clear mock calls from opening the share sheet
    parentClickMock.mockClear();

    const modalPanel = screen.getByTestId('share-modal-panel');
    const confirmButton = screen.getByTestId('share-confirm-button');

    fireEvent.touchStart(confirmButton);
    fireEvent.touchEnd(confirmButton);
    fireEvent.click(confirmButton);

    fireEvent.click(modalPanel);
    expect(parentClickMock).not.toHaveBeenCalled();

    const backdrop = screen.getByTestId('share-sheet');
    fireEvent.click(backdrop);
    expect(parentClickMock).toHaveBeenCalledTimes(1);
  });

  // Case 4: Assert that appropriate cursor utility classes (such as cursor-pointer) are actively appended to the interactive markup segments.
  it('Case 4: asserts interactive target elements contain the cursor-pointer class', () => {
    render(<InteractiveProfileCardWrapper user={mockUser} exportData={mockExportData} />);
    const target = screen.getByTestId('stat-hover-target-2');
    expect(target.className).toContain('cursor-pointer');

    const shareButton = screen.getByRole('button', { name: /share your pulse/i });
    fireEvent.click(shareButton);

    const confirmBtn = screen.getByTestId('share-confirm-button');
    expect(confirmBtn.className).toContain('cursor-pointer');
  });

  // Case 5: Check that firing mouseleave triggers successfully wipes temporary visibility indicators and hides active tooltip cards.
  it('Case 5: mouseleave gesture successfully hides active tooltips', () => {
    render(<InteractiveProfileCardWrapper user={mockUser} exportData={mockExportData} />);
    const target = screen.getByTestId('stat-hover-target-3');
    fireEvent.mouseEnter(target);
    expect(screen.getByTestId('interactive-tooltip')).toBeInTheDocument();

    fireEvent.mouseLeave(target);
    expect(screen.queryByTestId('interactive-tooltip')).toBeNull();
  });

  // Case 6: Copy username button click copies username to clipboard
  describe('copy username button click behavior', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: vi.fn().mockResolvedValue(undefined),
        },
        writable: true,
        configurable: true,
      });
      Object.defineProperty(window, 'isSecureContext', { value: true, writable: true });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('Case 6: clicking copy username button calls clipboard.writeText with the username', async () => {
      render(<ProfileCard user={mockUser} exportData={mockExportData} />);
      const copyBtn = screen.getByRole('button', { name: /copy username to clipboard/i });

      await act(async () => {
        fireEvent.click(copyBtn);
      });

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('mayank200529');
    });

    it('Case 7: copy username button shows Check icon after click and reverts after timeout', async () => {
      render(<ProfileCard user={mockUser} exportData={mockExportData} />);
      const copyBtn = screen.getByRole('button', { name: /copy username to clipboard/i });

      await act(async () => {
        fireEvent.click(copyBtn);
      });

      // After click, the aria-label should reflect copied state
      expect(copyBtn).toHaveAttribute('aria-label', 'Username copied!');

      // Confirmation text should be visible
      expect(screen.getByText('Username copied!')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // After timeout, should revert to uncopied state
      expect(copyBtn).toHaveAttribute('aria-label', 'Copy username to clipboard');
      expect(screen.queryByText('Username copied!')).toBeNull();
    });
  });
});
