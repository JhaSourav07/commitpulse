import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import SupportPage from './page';

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { children?: ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('[Bug] Support page — Discord invite link consistency', () => {
  it('links to the canonical Discord invite (matches DiscordButton/Footer)', () => {
    render(<SupportPage />);
    const discordLink = screen.getByRole('link', { name: /join our discord server/i });
    expect(discordLink).toHaveAttribute('href', 'https://discord.gg/f84SDraEBH');
  });

  it('does not link to the stale invite code', () => {
    render(<SupportPage />);
    const discordLink = screen.getByRole('link', { name: /join our discord server/i });
    expect(discordLink).not.toHaveAttribute('href', 'https://discord.gg/Cb73bS79j');
  });

  it('sets target and rel attributes for security on the Discord link', () => {
    render(<SupportPage />);
    const discordLink = screen.getByRole('link', { name: /join our discord server/i });
    expect(discordLink).toHaveAttribute('target', '_blank');
    expect(discordLink).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
