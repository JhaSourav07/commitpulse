import { fireEvent, render, screen } from '@testing-library/react';
import type { AnchorHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
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
  timezone: string;
  onUsernameChange: (value: string) => void;
  onTimezoneChange: (value: string) => void;
};

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

vi.mock('@/components/InteractiveViewer', () => ({
  default: ({ children, ...props }: MockContainerProps) => <div {...props}>{children}</div>,
}));

vi.mock('./components/ControlsPanel', () => ({
  ControlsPanel: ({
    username,
    timezone,
    onUsernameChange,
    onTimezoneChange,
  }: MockControlsPanelProps) => (
    <div>
      <input
        aria-label="Mock username"
        value={username}
        onChange={(event) => onUsernameChange(event.currentTarget.value)}
      />
      <select
        aria-label="Mock timezone"
        value={timezone}
        onChange={(event) => onTimezoneChange(event.currentTarget.value)}
      >
        <option value="UTC">UTC</option>
        <option value="Asia/Kolkata">Asia/Kolkata</option>
      </select>
    </div>
  ),
}));

vi.mock('./components/ExportPanel', () => ({
  ExportPanel: ({ snippet }: { snippet: string }) => (
    <output aria-label="Mock export snippet">{snippet}</output>
  ),
}));

describe('CustomizePage timezone query params', () => {
  it('omits the default UTC timezone from export snippets', () => {
    render(<CustomizePage />);

    fireEvent.change(screen.getByLabelText('Mock username'), {
      target: { value: 'octocat' },
    });

    const snippet = screen.getByLabelText('Mock export snippet').textContent;
    expect(snippet).toContain('user=octocat');
    expect(snippet).not.toContain('tz=');
  });

  it('adds a selected non-default timezone to export snippets', () => {
    render(<CustomizePage />);

    fireEvent.change(screen.getByLabelText('Mock username'), {
      target: { value: 'octocat' },
    });
    fireEvent.change(screen.getByLabelText('Mock timezone'), {
      target: { value: 'Asia/Kolkata' },
    });

    const snippet = screen.getByLabelText('Mock export snippet').textContent;
    expect(snippet).toContain('user=octocat');
    expect(snippet).toContain('tz=Asia%2FKolkata');
  });
});
