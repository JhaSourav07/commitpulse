import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { CodeBlock } from './code-block';

function mockColorScheme(prefersDark: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query === '(prefers-color-scheme: dark)' ? prefersDark : !prefersDark,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

describe('CodeBlock theme contrast', () => {
  const sampleCode = 'npm install commitpulse';

  let writeTextMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    writeTextMock = vi.fn().mockResolvedValue(undefined);

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: writeTextMock,
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('adapts visual elements for light mode color scheme', () => {
    mockColorScheme(false);

    render(<CodeBlock code={sampleCode} />);

    const button = screen.getByRole('button', {
      name: /copy code snippet/i,
    });

    const pre = document.querySelector('pre');

    expect(button.className).toContain('bg-gray-100');
    expect(button.className).toContain('text-gray-700');
    expect(button.className).toContain('border-black/10');

    expect(pre?.className).toContain('bg-gray-100');
    expect(pre?.className).toContain('text-emerald-700');
    expect(pre?.className).toContain('border-black/10');
  });

  it('adapts visual elements for dark mode color scheme', () => {
    mockColorScheme(true);

    render(<CodeBlock code={sampleCode} />);

    const button = screen.getByRole('button', {
      name: /copy code snippet/i,
    });

    const pre = document.querySelector('pre');

    expect(button.className).toContain('dark:bg-black/70');
    expect(button.className).toContain('dark:text-white/65');
    expect(button.className).toContain('dark:border-white/10');

    expect(pre?.className).toContain('dark:bg-[#030303]');
    expect(pre?.className).toContain('dark:text-emerald-300');
    expect(pre?.className).toContain('dark:border-white/8');
  });

  it('enforces sufficient contrast through semantic color classes in both themes', () => {
    render(<CodeBlock code={sampleCode} />);

    const button = screen.getByRole('button', {
      name: /copy code snippet/i,
    });

    const pre = document.querySelector('pre');
    const code = pre?.querySelector('code');

    expect(button.className).toContain('bg-gray-100');
    expect(button.className).toContain('text-gray-700');

    expect(button.className).toContain('dark:bg-black/70');
    expect(button.className).toContain('dark:text-white/65');

    expect(pre?.className).toContain('bg-gray-100');
    expect(pre?.className).toContain('text-emerald-700');

    expect(pre?.className).toContain('dark:bg-[#030303]');
    expect(pre?.className).toContain('dark:text-emerald-300');

    expect(code).toBeVisible();
    expect(code?.textContent).toBe(sampleCode);
  });

  it('has specific custom stylesheet properties and Tailwind classes active in markup', () => {
    render(<CodeBlock code={sampleCode} />);

    const pre = document.querySelector('pre');
    const button = screen.getByRole('button', {
      name: /copy code snippet/i,
    });

    expect(pre?.className).toContain('rounded-[1.5rem]');
    expect(pre?.className).toContain('overflow-x-auto');
    expect(pre?.className).toContain('p-4');
    expect(pre?.className).toContain('pr-24');

    expect(pre?.className).toContain('shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]');

    expect(button.className).toContain('uppercase');
    expect(button.className).toContain('tracking-[0.18em]');
    expect(button.className).toContain('rounded-full');
    expect(button.className).toContain('transition');
  });

  it('ensures background overlays do not clip foreground content colors and copy interaction remains functional', async () => {
    const user = userEvent.setup();

    render(<CodeBlock code={sampleCode} />);

    const pre = document.querySelector('pre');
    const code = pre?.querySelector('code');

    expect(code).toBeVisible();
    expect(code?.textContent).toBe(sampleCode);

    expect(pre?.className).toContain('overflow-x-auto');
    expect(pre?.className).not.toContain('overflow-hidden');

    const button = screen.getByRole('button', {
      name: /copy code snippet/i,
    });

    await user.click(button);

    expect(button).toHaveAttribute('aria-label', 'Copied snippet');

    expect(button).toHaveTextContent('Copied');
  });
});
