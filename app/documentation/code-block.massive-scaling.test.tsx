import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CodeBlock } from './code-block';

describe('CodeBlock massive scaling', () => {
  const writeTextMock = vi.fn();

  beforeEach(() => {
    writeTextMock.mockReset();

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: writeTextMock.mockResolvedValue(undefined),
      },
    });
  });

  it('renders extremely large code content without truncation', () => {
    const largeCode = Array.from({ length: 5000 }, (_, i) => `const value${i} = ${i};`).join('\n');

    const { container } = render(<CodeBlock code={largeCode} />);

    const codeElement = container.querySelector('code');

    expect(codeElement).toBeInTheDocument();
    expect(codeElement?.textContent).toBe(largeCode);
  });

  it('preserves layout structure for very large code blocks', () => {
    const largeCode = 'console.log("scale");\n'.repeat(10000);

    const { container } = render(<CodeBlock code={largeCode} />);

    const pre = container.querySelector('pre');
    const code = container.querySelector('code');

    expect(pre).toBeInTheDocument();
    expect(code).toBeInTheDocument();

    expect(pre?.className).toContain('overflow-x-auto');
    expect(pre?.className).toContain('rounded-[1.5rem]');
  });

  it('copies large payloads successfully to clipboard', async () => {
    const hugeSnippet = 'npm run build\n'.repeat(8000);

    render(<CodeBlock code={hugeSnippet} />);

    fireEvent.click(
      screen.getByRole('button', {
        name: /copy code snippet/i,
      })
    );

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith(hugeSnippet);
    });
  });

  it('renders many CodeBlock instances without breaking structure', () => {
    const { container } = render(
      <>
        {Array.from({ length: 100 }).map((_, index) => (
          <CodeBlock key={index} code={`const block${index} = ${index};`} />
        ))}
      </>
    );

    expect(container.querySelectorAll('pre')).toHaveLength(100);
    expect(container.querySelectorAll('button')).toHaveLength(100);
    expect(container.querySelectorAll('code')).toHaveLength(100);
  });

  it('maintains acceptable render performance under repeated mounts', () => {
    const codePayload = 'performance-test\n'.repeat(2000);

    const start = performance.now();

    for (let i = 0; i < 100; i++) {
      const { unmount } = render(<CodeBlock code={codePayload} />);
      unmount();
    }

    const duration = performance.now() - start;

    expect(duration).toBeLessThan(5000);
  });
});
