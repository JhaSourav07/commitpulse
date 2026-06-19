import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Footer } from './Footer';

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    className,
    ...props
  }: {
    href: string;
    children: ReactNode;
    className?: string;
  } & AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} className={className} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, string>) => {
      const translations: Record<string, string> = {
        'footer.home': 'Home',
        'footer.generator': 'Generator',
        'footer.compare': 'Compare',
        'footer.customization': 'Customization',
        'footer.contributors': 'Contributors',
        'footer.documentation': 'Documentation',
        'footer.github_repo': 'GitHub Repo',
        'footer.github': 'GitHub',
        'footer.creator_github': 'Creator GitHub',
        'footer.discord': 'Discord',
        'footer.twitter': 'Twitter',
        'footer.linkedin': 'LinkedIn',
        'footer.navigation': 'Navigation',
        'footer.resources': 'Resources',
        'footer.connect': 'Connect',
        'footer.made_with': 'Made with love',
      };

      return translations[key] ?? key;
    },
  }),
}));

describe('Footer theme contrast visual cohesion', () => {
  it('renders footer with light theme contrast classes', () => {
    render(<Footer />);

    const footer = screen.getByRole('contentinfo');

    expect(footer).toHaveClass('bg-gradient-to-b');
    expect(footer).toHaveClass('from-white/40');
    expect(footer).toHaveClass('backdrop-blur-md');
  });

  it('renders footer with dark theme contrast classes', () => {
    render(<Footer />);

    const footer = screen.getByRole('contentinfo');

    expect(footer).toHaveClass('dark:from-zinc-950/40');
    expect(footer).toHaveClass('dark:to-zinc-950/80');
  });

  it('keeps heading text readable in both light and dark modes', () => {
    render(<Footer />);

    expect(screen.getByText('CommitPulse')).toHaveClass('bg-clip-text');
    expect(screen.getByText('CommitPulse')).toHaveClass('text-transparent');
  });

  it('keeps footer links readable and interactive across themes', () => {
    render(<Footer />);

    const homeLink = screen.getByRole('link', { name: 'Home' });

    expect(homeLink).toHaveClass('text-zinc-600');
    expect(homeLink).toHaveClass('dark:text-zinc-400');
    expect(homeLink).toHaveClass('hover:-translate-y-[2px]');
  });

  it('keeps overlays and divider styles from clipping foreground content', () => {
    render(<Footer />);

    const footer = screen.getByRole('contentinfo');
    const copyright = screen.getByText(new RegExp(`${new Date().getFullYear()} CommitPulse`));

    expect(footer).toHaveClass('px-4');
    expect(footer).toHaveClass('py-8');
    expect(copyright).toBeInTheDocument();
  });
});
