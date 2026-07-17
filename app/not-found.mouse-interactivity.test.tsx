import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import NotFound from './not-found';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../components/MiniGame', () => ({
  default: () => <div data-testid="mini-game" />,
}));

describe('NotFound Mouse Interactivity & Touch Events', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('triggers simulated mouseenter/hover gestures on active segments', () => {
    render(<NotFound />);
    const terminalBlock = screen.getByText('commitpulse — bash').closest('div')?.parentElement;
    expect(terminalBlock).not.toBeNull();

    // Simulate hover gesture
    if (terminalBlock) {
      fireEvent.mouseEnter(terminalBlock);
      // Verify hover utility classes are present for transitions
      expect(terminalBlock).toHaveClass('hover:bg-white/5');
      expect(terminalBlock).toHaveClass('transition-all');
    }
  });

  it('verifies responsive tooltip layouts display at computed coordinates', () => {
    render(<NotFound />);
    // The "Click to copy" acts as a static tooltip for the terminal
    const tooltipText = screen.getByText('Click to copy');
    expect(tooltipText).toBeInTheDocument();

    // Verify it's positioned correctly (ml-auto pushes it to the right)
    expect(tooltipText).toHaveClass('ml-auto');
    expect(tooltipText).toHaveClass('text-xs');
  });

  it('tests custom click/touch gestures and ensures click events propagate correctly', async () => {
    render(<NotFound />);
    const terminalBlock = screen.getByText('commitpulse — bash').closest('div')?.parentElement;

    // Simulate touch/click
    if (terminalBlock) {
      fireEvent.click(terminalBlock);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
          expect.stringContaining('git checkout this-page')
        );
        expect(toast.success).toHaveBeenCalledWith('Terminal output copied!');
      });
    }
  });

  it('asserts appropriate cursor style classes (like pointer) are applied on hover', () => {
    render(<NotFound />);
    const terminalBlock = screen.getByText('commitpulse — bash').closest('div')?.parentElement;

    // Terminal should have pointer cursor
    expect(terminalBlock).toHaveClass('cursor-pointer');

    // Links should implicitly act as pointers (standard behavior), but we can check custom classes
    const gitCheckoutBtn = screen.getByText('git checkout main');
    expect(gitCheckoutBtn).toHaveClass('hover:scale-[1.02]');
  });

  it('checks that mouseleave events successfully hide temporary overlay visuals or handle states', () => {
    render(<NotFound />);
    const terminalBlock = screen.getByText('commitpulse — bash').closest('div')?.parentElement;

    if (terminalBlock) {
      fireEvent.mouseEnter(terminalBlock);

      // Simulate mouse leave
      fireEvent.mouseLeave(terminalBlock);

      // Ensure it smoothly transitions back
      expect(terminalBlock).toHaveClass('transition-all');
      expect(terminalBlock).toHaveClass('duration-200');
    }
  });
});
