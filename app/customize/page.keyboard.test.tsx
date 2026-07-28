import { fireEvent, render, screen } from '@testing-library/react';
import type { AnchorHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import CustomizePage from './page';

type MockLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children?: ReactNode;
  href: string;
};

type MockContainerProps = HTMLAttributes<HTMLElement> & {
  children?: ReactNode;
};

type MockControlsPanelProps = {
  theme: string;
  onThemeChange: (value: string) => void;
};

const mockSearchParams = vi.hoisted(() => ({
  values: new Map<string, string>(),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: MockLinkProps) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('framer-motion', () => ({
  motion: {
    aside: ({ children, ...props }: MockContainerProps) => <aside {...props}>{children}</aside>,
    div: ({ children, ...props }: MockContainerProps) => <div {...props}>{children}</div>,
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: vi.fn(),
  }),
  useSearchParams: () => ({
    get: (key: string) => mockSearchParams.values.get(key) ?? null,
  }),
}));

vi.mock('@/components/InteractiveViewer', () => ({
  default: ({ children, ...props }: MockContainerProps) => <div {...props}>{children}</div>,
}));

vi.mock('./components/ControlsPanel', () => ({
  ControlsPanel: ({ theme, onThemeChange }: MockControlsPanelProps) => (
    <div>
      <output aria-label="Mock theme">{theme}</output>
      <button onClick={() => onThemeChange('dark')}>Change Theme</button>
    </div>
  ),
}));

vi.mock('./components/AdvancedSettingsPanel', () => ({
  AdvancedSettingsPanel: () => <div />,
}));

vi.mock('./components/ExportPanel', () => ({
  ExportPanel: ({ onCopy }: { onCopy: () => void }) => (
    <div>
      <button id="copy-markdown-btn" onClick={onCopy}>
        Copy
      </button>
      <button id="download-svg-btn" onClick={() => {}}>
        Download
      </button>
    </div>
  ),
}));

vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('CustomizePage Keyboard Shortcuts', () => {
  beforeEach(() => {
    mockSearchParams.values.clear();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => '<svg></svg>',
    });
    vi.spyOn(window, 'getSelection').mockReturnValue({
      toString: () => '',
    } as unknown as Selection);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('handles Ctrl/Cmd+C to copy', () => {
    render(<CustomizePage />);

    const copyBtn = document.querySelector<HTMLButtonElement>('#copy-markdown-btn');
    const clickSpy = vi.spyOn(copyBtn!, 'click');

    fireEvent.keyDown(window, { key: 'c', ctrlKey: true });
    expect(clickSpy).toHaveBeenCalled();
  });

  it('handles Ctrl/Cmd+S to download', () => {
    render(<CustomizePage />);

    const downloadBtn = document.querySelector<HTMLButtonElement>('#download-svg-btn');
    const clickSpy = vi.spyOn(downloadBtn!, 'click');

    fireEvent.keyDown(window, { key: 's', ctrlKey: true });
    expect(clickSpy).toHaveBeenCalled();
  });

  it('blurs active element on Escape', () => {
    render(<CustomizePage />);

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    expect(document.activeElement).toBe(input);

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(document.activeElement).not.toBe(input);
    document.body.removeChild(input);
  });

  it('navigates themes with ArrowLeft and ArrowRight', () => {
    render(<CustomizePage />);

    const themeOutput = screen.getByLabelText('Mock theme');
    expect(themeOutput.textContent).toBe('dark'); // default theme

    // Since 'dark' is in THEME_KEYS, ArrowRight should go to the next theme
    fireEvent.keyDown(window, { key: 'ArrowRight' });

    // We expect the theme to have updated
    expect(themeOutput.textContent).not.toBe('dark');
  });

  it('does not trigger shortcuts when typing in input, textarea, or contenteditable', () => {
    render(<CustomizePage />);

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    const copyBtn = document.querySelector<HTMLButtonElement>('#copy-markdown-btn');
    const clickSpy = vi.spyOn(copyBtn!, 'click');

    // Simulate keydown on the input element
    fireEvent.keyDown(input, { key: 'c', ctrlKey: true });

    expect(clickSpy).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });
});
