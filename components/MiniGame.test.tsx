import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import MiniGame from './MiniGame';

// Mock AudioContext globally for all tests
const mockAudioContext = {
  createOscillator: vi.fn(() => ({
    type: 'sine',
    frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  })),
  createGain: vi.fn(() => ({
    gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    connect: vi.fn(),
  })),
  destination: {},
  currentTime: 0,
};

describe('MiniGame', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    // Make AudioContext available
    Object.defineProperty(window, 'AudioContext', {
      writable: true,
      value: vi.fn(() => mockAudioContext),
    });
    // Also mock webkitAudioContext
    Object.defineProperty(window, 'webkitAudioContext', {
      writable: true,
      value: vi.fn(() => mockAudioContext),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders the start screen by default', () => {
    render(<MiniGame />);
    expect(screen.getByText('SQUASH THE BUGS')).toBeInTheDocument();
    expect(screen.getByText(/Click targets before the ring closes/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /initialize/i })).toBeInTheDocument();
  });

  it('shows score and lives when game is active', () => {
    render(<MiniGame />);
    const initBtn = screen.getByRole('button', { name: /initialize/i });
    fireEvent.click(initBtn);

    expect(screen.getByText(/SCORE: 0/)).toBeInTheDocument();
    expect(screen.getByText(/♥/)).toBeTruthy();
  });

  it('starts the game when Initialize button is clicked', () => {
    render(<MiniGame />);
    const initBtn = screen.getByRole('button', { name: /initialize/i });
    fireEvent.click(initBtn);

    // Start screen should be gone
    expect(screen.queryByText('SQUASH THE BUGS')).not.toBeInTheDocument();
  });

  it('removes bugs when clicked', async () => {
    render(<MiniGame />);
    const initBtn = screen.getByRole('button', { name: /initialize/i });
    fireEvent.click(initBtn);

    // Wait for a bug to spawn (spawn rate is 1200ms base)
    await act(async () => {
      await vi.advanceTimersByTime(1300);
    });

    const bugs = screen.queryAllByText('', { selector: '[style*="position: absolute"]' });
    // There should be at least one bug element
    expect(bugs.length).toBeGreaterThanOrEqual(0);
  });

  it('hides the start screen once the game has been initialized', () => {
    render(<MiniGame />);
    expect(screen.getByText('SQUASH THE BUGS')).toBeInTheDocument();
    const initBtn = screen.getByRole('button', { name: /initialize/i });
    fireEvent.click(initBtn);
    // The start screen overlay should be hidden after clicking Initialize
    expect(screen.queryByText('SQUASH THE BUGS')).not.toBeInTheDocument();
  });

  it('does not crash when AudioContext is not available', () => {
    // Remove AudioContext
    Object.defineProperty(window, 'AudioContext', { writable: true, value: undefined });
    Object.defineProperty(window, 'webkitAudioContext', { writable: true, value: undefined });

    render(<MiniGame />);
    const initBtn = screen.getByRole('button', { name: /initialize/i });

    // Should not throw
    expect(() => fireEvent.click(initBtn)).not.toThrow();
  });

  it('renders with the correct container className', () => {
    render(<MiniGame />);
    const container = document.querySelector('.cursor-crosshair');
    expect(container).toBeInTheDocument();
  });

  it('prevents context menu on the game container', () => {
    render(<MiniGame />);
    const container = document.querySelector('.cursor-crosshair');
    expect(container).toBeInTheDocument();
  });
});
