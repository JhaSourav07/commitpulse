import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import CopyRepoButton from './CopyRepoButton';

describe('CopyRepoButton empty fallback behavior', () => {
  it('renders safely without props', () => {
    render(<CopyRepoButton />);

    expect(screen.getByRole('button', { name: /copy url/i })).toBeTruthy();
  });

  it('shows default button text in empty state', () => {
    render(<CopyRepoButton />);

    expect(screen.getByText('Copy URL')).toBeTruthy();
  });

  it('maintains default styling classes', () => {
    render(<CopyRepoButton />);

    const button = screen.getByRole('button');

    expect(button.className).toContain('rounded-2xl');
    expect(button.className).toContain('bg-white');
  });

  it('does not throw runtime errors during render', () => {
    expect(() => render(<CopyRepoButton />)).not.toThrow();
  });

  it('renders expected DOM structure with icon and button text', () => {
    render(<CopyRepoButton />);

    const button = screen.getByRole('button');

    expect(button).toBeTruthy();
    expect(button.textContent).toContain('Copy URL');
  });
});
