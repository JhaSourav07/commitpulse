/**
 * Tests for the dark/light preview background toggle on the customize page.
 *
 * The toggle is a purely local visual feature (#2425). It lets users switch the
 * preview container background between GitHub-dark (#0d1117) and GitHub-light
 * (#ffffff) so they can see how their isometric SVG embed will look in both
 * README contexts - without changing any URL parameters.
 */

import { act, fireEvent, render, screen } from '@testing-library/react';
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
  username: string;
  radius: number;
  onUsernameChange: (value: string) => void;
};

type MockAdvancedSettingsPanelProps = {
  timezone: string;
  badgeWidth: number | '';
  badgeHeight: number | '';
  grace: number;
  onTimezoneChange: (value: string) => void;
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
  ControlsPanel: ({ username, radius, onUsernameChange }: MockControlsPanelProps) => (
    <div>
      <input
        aria-label="Mock username"
        value={username}
        onChange={(event) => onUsernameChange(event.currentTarget.value)}
      />
      <output aria-label="Mock radius">{String(radius)}</output>
    </div>
  ),
}));

vi.mock('./components/AdvancedSettingsPanel', () => ({
  AdvancedSettingsPanel: ({
    timezone,
    badgeWidth,
    badgeHeight,
    grace,
    onTimezoneChange,
  }: MockAdvancedSettingsPanelProps) => (
    <div>
      <select
        aria-label="Mock timezone"
        value={timezone}
        onChange={(event) => onTimezoneChange(event.currentTarget.value)}
      >
        <option value="UTC">UTC</option>
        <option value="Asia/Kolkata">Asia/Kolkata</option>
      </select>
      <output aria-label="Mock badge width">{String(badgeWidth)}</output>
      <output aria-label="Mock badge height">{String(badgeHeight)}</output>
      <output aria-label="Mock grace">{String(grace)}</output>
    </div>
  ),
}));

vi.mock('./components/ExportPanel', () => ({
  ExportPanel: ({ snippet }: { snippet: string }) => (
    <output aria-label="Mock export snippet">{snippet}</output>
  ),
}));

describe('Preview background toggle (#2425)', () => {
  beforeEach(() => {
    mockSearchParams.values.clear();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => '<svg></svg>',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the preview-bg toggle button on page load', () => {
    render(<CustomizePage />);
    const toggle = screen.getByRole('button', { name: /switch to light background preview/i });
    expect(toggle).toBeInTheDocument();
  });

  it('initialises the preview container with dark background (data-preview-bg="dark")', () => {
    render(<CustomizePage />);
    const previewContainer = document.querySelector('[data-preview-bg]');
    expect(previewContainer).not.toBeNull();
    expect(previewContainer?.getAttribute('data-preview-bg')).toBe('dark');
  });

  it('switches preview container to light background on first click', async () => {
    render(<CustomizePage />);

    const toggle = screen.getByRole('button', { name: /switch to light background preview/i });

    await act(async () => {
      fireEvent.click(toggle);
    });

    const previewContainer = document.querySelector('[data-preview-bg]');
    expect(previewContainer?.getAttribute('data-preview-bg')).toBe('light');
  });

  it('shows "Dark" label after switching to light background', async () => {
    render(<CustomizePage />);

    const toggle = screen.getByRole('button', { name: /switch to light background preview/i });

    await act(async () => {
      fireEvent.click(toggle);
    });

    const darkToggle = screen.getByRole('button', { name: /switch to dark background preview/i });
    expect(darkToggle).toBeInTheDocument();
    expect(darkToggle).toHaveTextContent('Dark');
  });

  it('toggles back to dark background on second click', async () => {
    render(<CustomizePage />);

    const firstToggle = screen.getByRole('button', { name: /switch to light background preview/i });

    await act(async () => {
      fireEvent.click(firstToggle);
    });

    const secondToggle = screen.getByRole('button', {
      name: /switch to dark background preview/i,
    });

    await act(async () => {
      fireEvent.click(secondToggle);
    });

    const previewContainer = document.querySelector('[data-preview-bg]');
    expect(previewContainer?.getAttribute('data-preview-bg')).toBe('dark');
  });

  it('does NOT include preview background state in the export snippet URL', async () => {
    render(<CustomizePage />);

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Mock username'), {
        target: { value: 'octocat' },
      });
    });

    const toggle = screen.getByRole('button', { name: /switch to light background preview/i });
    await act(async () => {
      fireEvent.click(toggle);
    });

    const snippet = screen.getByLabelText('Mock export snippet').textContent ?? '';
    expect(snippet).toContain('user=octocat');
    expect(snippet).not.toContain('preview_bg');
    expect(snippet).not.toContain('bg_mode');
    expect(snippet).not.toContain('previewBg');
  });

  it('does NOT mutate the page URL when toggling the preview background', async () => {
    const replaceStateSpy = vi.spyOn(window.history, 'replaceState');

    render(<CustomizePage />);

    const callsBefore = replaceStateSpy.mock.calls.length;

    const toggle = screen.getByRole('button', { name: /switch to light background preview/i });
    await act(async () => {
      fireEvent.click(toggle);
    });

    expect(replaceStateSpy.mock.calls.length).toBe(callsBefore);
  });
});
