import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { CodeBlock } from './code-block';

describe('CodeBlock', () => {
  const codeSnippet = "const status = 'ready';";
  const writeTextMock = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: writeTextMock,
      },
      configurable: true,
    });
    writeTextMock.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the code prop inside a code element', () => {
    const { container } = render(<CodeBlock code={codeSnippet} />);

    const codeElement = container.querySelector('code');
    expect(codeElement).toBeTruthy();
    expect(codeElement?.textContent).toBe(codeSnippet);
  });

  it('renders the copy button with the correct label', () => {
    render(<CodeBlock code={codeSnippet} />);

    const copyButton = screen.getByRole('button', { name: /copy/i });
    expect(copyButton).toBeTruthy();
    expect(copyButton.textContent).toContain('Copy');
  });

  it('calls clipboard.writeText with the code when copy is clicked', async () => {
    render(<CodeBlock code={codeSnippet} />);

    fireEvent.click(screen.getByRole('button', { name: /copy/i }));

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith(codeSnippet);
    });
  });

  it('changes the button label to Copied after clicking copy', async () => {
    render(<CodeBlock code={codeSnippet} />);

    fireEvent.click(screen.getByRole('button', { name: /copy/i }));

    const copiedButton = await screen.findByRole('button', { name: /copied/i });
    expect(copiedButton.textContent).toContain('Copied');
  });

  it('reverts the button label to Copy after 2000ms', async () => {
    vi.useFakeTimers();
    render(<CodeBlock code={codeSnippet} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /copy/i }));
    });

    expect(writeTextMock).toHaveBeenCalledWith(codeSnippet);
    expect(screen.getByRole('button', { name: /copied/i })).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByRole('button', { name: /copy/i })).toBeTruthy();
  });
});
