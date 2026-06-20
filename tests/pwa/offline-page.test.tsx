import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import OfflineFallback from '@/components/pwa/OfflineFallback';

// Mock location.reload
const reloadMock = vi.fn();
Object.defineProperty(window, 'location', {
  value: { reload: reloadMock },
  writable: true,
});

describe('OfflineFallback Component', () => {
  beforeEach(() => {
    reloadMock.mockClear();
  });

  it('renders connection lost header, description, and button', () => {
    render(<OfflineFallback />);

    expect(screen.getByText('Connection Lost')).toBeInTheDocument();
    expect(
      screen.getByText(
        'You are currently offline. Check your internet connection and try refreshing the page.'
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('triggers page reload when try again button is clicked', () => {
    render(<OfflineFallback />);

    const button = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(button);

    expect(reloadMock).toHaveBeenCalledTimes(1);
    expect(button).toBeDisabled();
  });
});
