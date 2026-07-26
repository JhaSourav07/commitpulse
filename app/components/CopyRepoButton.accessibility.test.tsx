import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import CopyRepoButton from './CopyRepoButton';

vi.mock('lucide-react', () => ({
  Copy: () => <svg aria-hidden="true" data-testid="copy-icon" />,
}));

Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
});

describe('CopyRepoButton accessibility behavior', () => {
  it('renders as an accessible button with visible label', () => {
    render(<CopyRepoButton />);

    expect(screen.getByRole('button', { name: /copy url/i })).toBeDefined();
  });

  it('keeps decorative copy icon hidden from assistive technology', () => {
    render(<CopyRepoButton />);

    expect(screen.getByTestId('copy-icon').getAttribute('aria-hidden')).toBe('true');
  });

  it('is keyboard focusable through the native button element', () => {
    render(<CopyRepoButton />);

    const button = screen.getByRole('button', { name: /copy url/i });
    button.focus();

    expect(document.activeElement).toBe(button);
  });

  it('updates accessible button name after successful copy action', async () => {
    render(<CopyRepoButton />);

    const button = screen.getByRole('button', { name: /copy url/i });
    fireEvent.click(button);

    expect(await screen.findByRole('button', { name: /copied/i })).toBeDefined();
  });

  it('preserves semantic button role after interaction', async () => {
    render(<CopyRepoButton />);

    fireEvent.click(screen.getByRole('button', { name: /copy url/i }));

    expect(await screen.findByRole('button', { name: /copied/i })).toBeDefined();
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });
});
