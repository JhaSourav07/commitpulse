import { render, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CodeBlock } from './code-block';

const mockWriteText = vi.fn();
beforeEach(() => {
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: mockWriteText,
    },
    configurable: true,
  });

  mockWriteText.mockReset();
});

describe('CodeBlock Mock Integrations', () => {
  it('calls the clipboard service with the provided code', async () => {
    mockWriteText.mockResolvedValue(undefined);

    const { getByRole } = render(<CodeBlock code={'console.log("Hello");'} />);

    fireEvent.click(getByRole('button', { name: /copy code snippet/i }));

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith('console.log("Hello");');
    });
  });
  it('shows Copied after a successful clipboard write', async () => {
    mockWriteText.mockResolvedValue(undefined);

    const { getByRole, findByText } = render(<CodeBlock code={'console.log("Hello");'} />);

    fireEvent.click(getByRole('button', { name: /copy code snippet/i }));

    const copiedText = await findByText('Copied');
    expect(copiedText).toBeTruthy();
  });
  it('keeps the Copy button when the clipboard service fails', async () => {
    mockWriteText.mockRejectedValue(new Error('Clipboard failed'));

    const { getByRole, findByRole } = render(<CodeBlock code={'console.log("Hello");'} />);

    fireEvent.click(getByRole('button', { name: /copy code snippet/i }));

    const copyButton = await findByRole('button', {
      name: /copy code snippet/i,
    });

    expect(copyButton).toBeTruthy();
    expect(mockWriteText).toHaveBeenCalledTimes(1);
  });
  it('calls the clipboard service for each copy action', async () => {
    mockWriteText.mockResolvedValue(undefined);

    const { getByRole } = render(<CodeBlock code={'console.log("Hello");'} />);

    const copyButton = getByRole('button', {
      name: /copy code snippet/i,
    });

    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledTimes(1);
    });

    // After the first click, the button's aria-label changes to "Copied snippet"
    const copiedButton = getByRole('button', {
      name: /copied snippet/i,
    });

    fireEvent.click(copiedButton);

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledTimes(2);
    });
  });
  it('cleans up the timeout when the component unmounts', async () => {
    mockWriteText.mockResolvedValue(undefined);

    const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');

    const { getByRole, unmount } = render(<CodeBlock code={'console.log("Hello");'} />);

    fireEvent.click(getByRole('button', { name: /copy code snippet/i }));

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalled();
    });

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();

    clearTimeoutSpy.mockRestore();
  });
});
