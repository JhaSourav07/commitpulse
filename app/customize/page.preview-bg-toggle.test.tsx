/**
 * Tests for the GitHub Background Simulator toggle on the customize page.
 *
 * The toggle is a purely local visual feature (#8287). It lets users switch the
 * preview container background between GitHub-dark (#0d1117), GitHub-light
 * (#ffffff), and a Checkerboard Grid so they can see how their isometric SVG
 * embed will look in all common README contexts — without changing any URL parameters.
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

describe('Preview background simulator (#8287)', () => {
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

  it('renders the Dark, Light, and Grid simulator buttons on page load', () => {
    render(<CustomizePage />);
    // The simulator renders buttons inside a group labelled "GitHub Background Simulator"
    const group = screen.getByRole('group', { name: /github background simulator/i });
    expect(group).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /^dark$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^light$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^grid$/i })).toBeInTheDocument();
  });

  it('initialises the preview container with dark background (data-preview-bg="dark")', () => {
    render(<CustomizePage />);
    const previewContainer = document.querySelector('[data-preview-bg]');
    expect(previewContainer).not.toBeNull();
    expect(previewContainer?.getAttribute('data-preview-bg')).toBe('dark');
  });

  it('Dark button is pressed by default', () => {
    render(<CustomizePage />);
    const darkBtn = screen.getByRole('button', { name: /^dark$/i });
    expect(darkBtn.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: /^light$/i }).getAttribute('aria-pressed')).toBe(
      'false'
    );
    expect(screen.getByRole('button', { name: /^grid$/i }).getAttribute('aria-pressed')).toBe(
      'false'
    );
  });

  it('switches preview container to light background when Light button is clicked', async () => {
    render(<CustomizePage />);

    const lightBtn = screen.getByRole('button', { name: /^light$/i });

    await act(async () => {
      fireEvent.click(lightBtn);
    });

    const previewContainer = document.querySelector('[data-preview-bg]');
    expect(previewContainer?.getAttribute('data-preview-bg')).toBe('light');
  });

  it('switches preview container to checkerboard when Grid button is clicked', async () => {
    render(<CustomizePage />);

    const gridBtn = screen.getByRole('button', { name: /^grid$/i });

    await act(async () => {
      fireEvent.click(gridBtn);
    });

    const previewContainer = document.querySelector('[data-preview-bg]');
    expect(previewContainer?.getAttribute('data-preview-bg')).toBe('checkerboard');
  });

  it('toggles back to dark background when Dark button is clicked again', async () => {
    render(<CustomizePage />);

    // Go to light first
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^light$/i }));
    });

    expect(document.querySelector('[data-preview-bg]')?.getAttribute('data-preview-bg')).toBe(
      'light'
    );

    // Then back to dark
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^dark$/i }));
    });

    expect(document.querySelector('[data-preview-bg]')?.getAttribute('data-preview-bg')).toBe(
      'dark'
    );
  });

  it('does NOT include preview background state in the export snippet URL', async () => {
    render(<CustomizePage />);

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Mock username'), {
        target: { value: 'octocat' },
      });
    });

    const lightBtn = screen.getByRole('button', { name: /^light$/i });
    await act(async () => {
      fireEvent.click(lightBtn);
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

    const lightBtn = screen.getByRole('button', { name: /^light$/i });
    await act(async () => {
      fireEvent.click(lightBtn);
    });

    expect(replaceStateSpy.mock.calls.length).toBe(callsBefore);
  });
});
