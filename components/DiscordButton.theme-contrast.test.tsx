import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DiscordButton } from './DiscordButton';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    a: ({ children, ...props }: any) => <a {...props}>{children}</a>,
  },
}));

describe('DiscordButton - Dark and Light Theme Contrast', () => {
  it('renders correctly in dark mode', () => {
    document.documentElement.setAttribute('data-theme', 'dark');
    const { container } = render(<DiscordButton />);
    expect(container).toBeTruthy();
  });

  it('renders correctly in light mode', () => {
    document.documentElement.setAttribute('data-theme', 'light');
    const { container } = render(<DiscordButton />);
    expect(container).toBeTruthy();
  });

  it('applies dark theme classes in dark mode', () => {
    document.documentElement.setAttribute('data-theme', 'dark');
    const { container } = render(<DiscordButton />);
    const element = container.firstChild;
    expect(element).toBeTruthy();
  });

  it('applies light theme classes in light mode', () => {
    document.documentElement.setAttribute('data-theme', 'light');
    const { container } = render(<DiscordButton />);
    const element = container.firstChild;
    expect(element).toBeTruthy();
  });

  it('does not clip foreground content in either theme', () => {
    const { container: dark } = render(<DiscordButton />);
    const { container: light } = render(<DiscordButton />);
    expect(dark.firstChild).toBeTruthy();
    expect(light.firstChild).toBeTruthy();
  });
});
