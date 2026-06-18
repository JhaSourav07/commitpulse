import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { HeroSection } from './HeroSection';

vi.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    p: 'p',
  },
}));

vi.mock('lucide-react', () => ({
  Copy: () => <svg data-testid="copy-icon" />,
}));

describe('HeroSection - Interactive Tooltips, Cursor Hovers & Touch Event Propagation', () => {
  it('applies hover styling to the Copy Link button', () => {
    render(<HeroSection />);

    const copyButton = screen.getByRole('button', {
      name: /copy link/i,
    });

    expect(copyButton.className).toContain('hover:bg-gray-100');
  });

  it('applies hover styling to the Watch Dashboard button', () => {
    render(<HeroSection />);

    const watchButton = screen.getByRole('button', {
      name: /watch dashboard/i,
    });

    expect(watchButton.className).toContain('hover:bg-[#4a35da]');
  });

  it('allows click events to propagate through interactive controls', () => {
    const parentClick = vi.fn();

    render(
      <div onClick={parentClick}>
        <HeroSection />
      </div>
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: /copy link/i,
      })
    );

    expect(parentClick).toHaveBeenCalledTimes(1);
  });

  it('allows touch events to propagate through interactive controls', () => {
    const parentTouch = vi.fn();

    render(
      <div onTouchStart={parentTouch}>
        <HeroSection />
      </div>
    );

    fireEvent.touchStart(
      screen.getByRole('button', {
        name: /copy link/i,
      })
    );

    expect(parentTouch).toHaveBeenCalledTimes(1);
  });

  it('handles mouse enter, move and leave events on the username input without errors', () => {
    render(<HeroSection />);

    const input = screen.getByRole('textbox', {
      name: /github username/i,
    });

    fireEvent.mouseEnter(input);
    fireEvent.mouseMove(input, {
      clientX: 50,
      clientY: 25,
    });
    fireEvent.mouseLeave(input);

    expect(input).toBeInTheDocument();
  });
});
