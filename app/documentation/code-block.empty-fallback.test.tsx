import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CodeBlock } from './code-block';

// Mock Lucide icons if needed (optional, but good practice if not mocked globally)
vi.mock('lucide-react', async (importOriginal) => {
  const original = await importOriginal<typeof import('lucide-react')>();
  return {
    ...original,
  };
});

describe('CodeBlock - Edge Cases & Empty/Missing Inputs Verification', () => {
  const writeTextMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: writeTextMock,
      },
      configurable: true,
      writable: true,
    });
  });

  it('renders successfully with an empty string code', () => {
    render(<CodeBlock code="" />);
    const codeElement = screen
      .getByRole('button', { name: /copy/i })
      .closest('div')
      ?.querySelector('code');
    expect(codeElement).toBeInTheDocument();
    expect(codeElement?.textContent).toBe('');
  });

  it('renders successfully with a null code parameter (type casting)', () => {
    // Cast to any to simulate Javascript dynamic runtime execution with missing types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(() => render(<CodeBlock code={null as any} />)).not.toThrow();
    const codeElement = screen
      .getByRole('button', { name: /copy/i })
      .closest('div')
      ?.querySelector('code');
    expect(codeElement).toBeInTheDocument();
  });

  it('renders successfully with an undefined code parameter (type casting)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(() => render(<CodeBlock code={undefined as any} />)).not.toThrow();
    const codeElement = screen
      .getByRole('button', { name: /copy/i })
      .closest('div')
      ?.querySelector('code');
    expect(codeElement).toBeInTheDocument();
  });

  it('maintains the standard DOM structures (pre and button) in empty states', () => {
    const { container } = render(<CodeBlock code="" />);
    expect(container.querySelector('pre')).toBeInTheDocument();
    expect(container.querySelector('code')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
  });

  it('handles clipboard writing gracefully when clicked with empty code', async () => {
    writeTextMock.mockResolvedValue(undefined);
    render(<CodeBlock code="" />);

    const copyButton = screen.getByRole('button', { name: /copy code snippet/i });
    fireEvent.click(copyButton);

    expect(writeTextMock).toHaveBeenCalledWith('');
    await waitFor(() => {
      expect(screen.getByText(/copied/i)).toBeInTheDocument();
    });
  });
});
