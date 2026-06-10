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

describe('CustomizePage timezone query params', () => {
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

  it('omits the default UTC timezone from export snippets', async () => {
    render(<CustomizePage />);

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Mock username'), {
        target: { value: 'octocat' },
      });
    });

    const snippet = screen.getByLabelText('Mock export snippet').textContent;
    expect(snippet).toContain('user=octocat');
    expect(snippet).not.toContain('tz=');
  });

  it('adds a selected non-default timezone to export snippets', async () => {
    render(<CustomizePage />);

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Mock username'), {
        target: { value: 'octocat' },
      });
      fireEvent.change(screen.getByLabelText('Mock timezone'), {
        target: { value: 'Asia/Kolkata' },
      });
    });

    const snippet = screen.getByLabelText('Mock export snippet').textContent;
    expect(snippet).toContain('user=octocat');
    expect(snippet).toContain('tz=Asia%2FKolkata');
  });

  it('falls back when numeric URL params are malformed', () => {
    mockSearchParams.values.set('user', 'octocat');
    mockSearchParams.values.set('radius', 'abc');
    mockSearchParams.values.set('width', 'NaN');
    mockSearchParams.values.set('height', 'nope');
    mockSearchParams.values.set('grace', 'bad');

    render(<CustomizePage />);

    expect(screen.getByLabelText('Mock radius').textContent).toBe('8');
    expect(screen.getByLabelText('Mock badge width').textContent).toBe('');
    expect(screen.getByLabelText('Mock badge height').textContent).toBe('');
    expect(screen.getByLabelText('Mock grace').textContent).toBe('1');

    const snippet = screen.getByLabelText('Mock export snippet').textContent;
    expect(snippet).toContain('user=octocat');
    expect(snippet).not.toContain('radius=NaN');
    expect(snippet).not.toContain('width=NaN');
    expect(snippet).not.toContain('height=NaN');
    expect(snippet).not.toContain('grace=NaN');
  });
});
