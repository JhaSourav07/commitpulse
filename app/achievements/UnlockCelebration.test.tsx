import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UnlockCelebration } from './AchievementsClient';
import type { AchievementData } from '@/types/achievements';

const mockData = {
  def: { id: 'streak-master', name: 'Streak Master', icon: '🔥' },
  state: { unlocked: true, currentTier: 'gold', xpEarned: 250 },
} as unknown as AchievementData;

describe('UnlockCelebration accessibility', () => {
  beforeEach(() => {
    document.body.style.overflow = '';
  });

  it('renders as a labelled modal dialog', () => {
    render(<UnlockCelebration data={mockData} onClose={() => {}} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'achievement-unlock-title');
    expect(screen.getByText('Achievement Unlocked!')).toHaveAttribute(
      'id',
      'achievement-unlock-title'
    );
  });

  it('closes on Escape', () => {
    const onClose = vi.fn();
    render(<UnlockCelebration data={mockData} onClose={onClose} />);

    fireEvent.keyDown(document.body, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('moves focus into the dialog when it opens', async () => {
    render(<UnlockCelebration data={mockData} onClose={() => {}} />);

    // Focus is deferred to the next animation frame, so wait for it.
    await waitFor(() => expect(screen.getByRole('dialog')).toHaveFocus());
  });

  it('locks body scroll while open and restores it on close', () => {
    const { unmount } = render(<UnlockCelebration data={mockData} onClose={() => {}} />);
    expect(document.body.style.overflow).toBe('hidden');

    unmount();
    expect(document.body.style.overflow).toBe('');
  });
});
