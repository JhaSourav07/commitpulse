import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import CursorStyleSwitcher from './CursorStyleSwitcher';

describe('CursorStyleSwitcher Component', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders cursor style options', () => {
    render(<CursorStyleSwitcher />);
    expect(screen.getByRole('group', { name: 'Cursor style' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Normal' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Star' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bright' })).toBeInTheDocument();
  });

  it('defaults to Normal option pressed', () => {
    render(<CursorStyleSwitcher />);
    const normalBtn = screen.getByRole('button', { name: 'Normal' });
    expect(normalBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('updates selected style and fires custom event on button click', () => {
    const eventHandler = vi.fn();
    window.addEventListener('cursorstylechange', eventHandler);

    render(<CursorStyleSwitcher />);
    const starBtn = screen.getByRole('button', { name: 'Star' });

    fireEvent.click(starBtn);

    expect(starBtn).toHaveAttribute('aria-pressed', 'true');
    expect(window.localStorage.getItem('cursorStyle')).toBe('star');
    expect(eventHandler).toHaveBeenCalled();
    const event = eventHandler.mock.calls[0][0] as CustomEvent;
    expect(event.detail).toBe('star');

    window.removeEventListener('cursorstylechange', eventHandler);
  });

  it('initializes from localStorage if valid stored value exists', () => {
    window.localStorage.setItem('cursorStyle', 'bright');
    render(<CursorStyleSwitcher />);

    const brightBtn = screen.getByRole('button', { name: 'Bright' });
    expect(brightBtn).toHaveAttribute('aria-pressed', 'true');
  });
});
