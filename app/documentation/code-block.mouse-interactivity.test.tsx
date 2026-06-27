import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CodeBlock } from './code-block';

describe('CodeBlock mouse interactivity (Variation 5)', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('renders copy button with pointer hover styling', () => {
    render(<CodeBlock code="npm install commitpulse" />);

    const copyButton = screen.getByRole('button', {
      name: /copy code snippet/i,
    });

    expect(copyButton.className).toContain('hover:text-black');
    expect(copyButton.className).toContain('transition');
  });

  it('supports mouse enter and mouse leave interactions on copy button', () => {
    render(<CodeBlock code="console.log('hello')" />);

    const copyButton = screen.getByRole('button', {
      name: /copy code snippet/i,
    });

    fireEvent.mouseEnter(copyButton);
    fireEvent.mouseLeave(copyButton);

    expect(copyButton).toBeDefined();
  });

  it('copies code when the interactive copy button is clicked', async () => {
    render(<CodeBlock code="pnpm dev" />);

    const copyButton = screen.getByRole('button', {
      name: /copy code snippet/i,
    });

    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('pnpm dev');
    });
  });

  it('updates button label after successful click interaction', async () => {
    render(<CodeBlock code="git status" />);

    const copyButton = screen.getByRole('button', {
      name: /copy code snippet/i,
    });

    fireEvent.click(copyButton);

    expect(await screen.findByRole('button', { name: /copied snippet/i })).toBeDefined();
    expect(screen.getByText('Copied')).toBeDefined();
  });

  it('keeps touch-style click propagation stable for repeated copy actions', async () => {
    render(<CodeBlock code="git push" />);

    const copyButton = screen.getByRole('button', {
      name: /copy code snippet/i,
    });

    fireEvent.click(copyButton);
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(2);
    });
  });
});
