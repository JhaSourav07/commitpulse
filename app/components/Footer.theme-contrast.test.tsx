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
        'footer.tagline': 'Track your open-source journey.',
        'footer.navigation': 'Navigation',
        'footer.resources': 'Resources',
        'footer.connect': 'Connect',
        'footer.made_with': 'Made with love',
        'footer.copyright': `© ${values?.year} CommitPulse`,
      };

      return translations[key] ?? key;
    },
  }),
}));

describe('Footer theme contrast visual cohesion', () => {
  it('renders footer with light theme contrast classes', () => {
    render(<Footer />);

    const footer = screen.getByRole('contentinfo');

    expect(footer).toHaveClass('bg-white/50');
    expect(footer).toHaveClass('border-black/5');
    expect(footer).toHaveClass('backdrop-blur');
  });

  it('renders footer with dark theme contrast classes', () => {
    render(<Footer />);

    const footer = screen.getByRole('contentinfo');

    expect(footer).toHaveClass('dark:bg-zinc-950/50');
    expect(footer).toHaveClass('dark:border-white/5');
  });

  it('keeps heading text readable in both light and dark modes', () => {
    render(<Footer />);

    expect(screen.getByText('CommitPulse')).toHaveClass('text-black');
    expect(screen.getByText('CommitPulse')).toHaveClass('dark:text-white');
    expect(screen.getByText('Navigation')).toHaveClass('text-black');
    expect(screen.getByText('Navigation')).toHaveClass('dark:text-white');
    expect(screen.getByText('Resources')).toHaveClass('text-black');
    expect(screen.getByText('Resources')).toHaveClass('dark:text-white');
    expect(screen.getByText('Connect')).toHaveClass('text-black');
    expect(screen.getByText('Connect')).toHaveClass('dark:text-white');
  });

  it('keeps footer links readable and interactive across themes', () => {
    render(<Footer />);

    const homeLink = screen.getByRole('link', { name: 'Home' });
    const githubLink = screen.getByRole('link', { name: 'GitHub Repo' });

    expect(homeLink).toHaveClass('text-zinc-600');
    expect(homeLink).toHaveClass('dark:text-zinc-400');
    expect(homeLink).toHaveClass('hover:text-teal-800');
    expect(homeLink).toHaveClass('dark:hover:text-violet-400');

    expect(githubLink).toHaveClass('text-zinc-600');
    expect(githubLink).toHaveClass('dark:text-zinc-400');
  });

  it('keeps overlays and divider styles from clipping foreground content', () => {
    render(<Footer />);

    const footer = screen.getByRole('contentinfo');
    const tagline = screen.getByText('Track your open-source journey.');
    const copyright = screen.getByText(`© ${new Date().getFullYear()} CommitPulse`);

    expect(footer).toHaveClass('px-4');
    expect(footer).toHaveClass('py-8');
    expect(tagline).toHaveClass('text-zinc-600');
    expect(tagline).toHaveClass('dark:text-zinc-400');
    expect(copyright.parentElement).toHaveClass('text-zinc-500');
    expect(copyright.parentElement).toHaveClass('dark:text-zinc-500');
  });
});
