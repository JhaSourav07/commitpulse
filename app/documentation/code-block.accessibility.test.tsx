import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { CodeBlock } from './code-block';

describe('CodeBlock Accessibility', () => {
  const sampleCode = 'console.log("hello world");';

  beforeEach(() => {
    vi.clearAllMocks();

    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('renders copy button with accessible aria-label', () => {
    render(<CodeBlock code={sampleCode} />);

    expect(
      screen.getByRole('button', {
        name: /copy code snippet/i,
      })
    ).toBeInTheDocument();
  });

  it('renders code content for screen readers', () => {
    render(<CodeBlock code={sampleCode} />);

    expect(screen.getByText(sampleCode)).toBeInTheDocument();
  });

  it('maintains keyboard-focusable interactive control', () => {
    render(<CodeBlock code={sampleCode} />);

    const button = screen.getByRole('button');

    expect(button).not.toHaveAttribute('disabled');
  });

  it('updates accessible label after successful copy action', async () => {
    render(<CodeBlock code={sampleCode} />);

    const button = screen.getByRole('button', {
      name: /copy code snippet/i,
    });

    fireEvent.click(button);

    await waitFor(() => {
      expect(
        screen.getByRole('button', {
          name: /copied snippet/i,
        })
      ).toBeInTheDocument();
    });
  });

  it('preserves semantic code structure', () => {
    const { container } = render(<CodeBlock code={sampleCode} />);

    const pre = container.querySelector('pre');
    const code = container.querySelector('code');

    expect(pre).toBeInTheDocument();
    expect(code).toBeInTheDocument();
  });
});
