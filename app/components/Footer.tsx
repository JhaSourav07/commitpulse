'use client';

import Link from 'next/link';
import { useTranslation } from '@/context/TranslationContext';
import {
  MessageCircle,
  User,
  Home,
  Zap,
  GitCompare,
  Sliders,
  Users,
  BookOpen,
  HelpCircle,
  GitBranch,
} from 'lucide-react';
import { FaGithub, FaDiscord, FaTwitter, FaLinkedin } from 'react-icons/fa';

interface FooterLink {
  label: string;
  href: string;
  isExternal?: boolean;
  shortcut?: string;
}

interface SocialLink {
  label: string;
  href: string;
  ariaLabel: string;
  icon: string;
}

function LinkComponent({
  href,
  isExternal,
  children,
  className = '',
  ariaLabel,
}: {
  href: string;
  isExternal?: boolean;
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}) {
  const baseClasses = `group inline-block px-1 rounded transition-all duration-300 hover:-translate-y-[2px] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-zinc-950 ${className}`;

  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={baseClasses}
        aria-label={ariaLabel}
      >
        <span className="relative inline-block">
          {children}
          <span className="absolute left-0 -bottom-px h-px w-0 bg-slate-500 dark:bg-slate-400 transition-all duration-500 ease-out group-hover:w-full" />
        </span>
      </a>
    );
  }

  return (
    <Link href={href} className={baseClasses} aria-label={ariaLabel}>
      <span className="relative inline-block">
        {children}
        <span className="absolute left-0 -bottom-px h-px w-0 bg-slate-500 dark:bg-slate-400 transition-all duration-500 ease-out group-hover:w-full" />
      </span>
    </Link>
  );
}

const SOCIAL_ICON_MAP: Record<string, React.ReactNode> = {
  github: (
    <FaGithub
      size={15}
      className="shrink-0 transition-transform duration-300 group-hover:scale-110"
    />
  ),
  creator: (
    <User size={15} className="shrink-0 transition-transform duration-300 group-hover:scale-110" />
  ),
  discord: (
    <FaDiscord
      size={15}
      className="shrink-0 transition-transform duration-300 group-hover:scale-110"
    />
  ),
  twitter: (
    <FaTwitter
      size={15}
      className="shrink-0 transition-transform duration-300 group-hover:scale-110"
    />
  ),
  linkedin: (
    <FaLinkedin
      size={15}
      className="shrink-0 transition-transform duration-300 group-hover:scale-110"
    />
  ),
};

const NAV_ICON_MAP: Record<string, React.ReactNode> = {
  '/': (
    <Home size={15} className="shrink-0 transition-transform duration-300 group-hover:scale-110" />
  ),
  '/generator': (
    <Zap size={15} className="shrink-0 transition-transform duration-300 group-hover:scale-110" />
  ),
  '/compare': (
    <GitCompare
      size={15}
      className="shrink-0 transition-transform duration-300 group-hover:scale-110"
    />
  ),
  '/customize': (
    <Sliders
      size={15}
      className="shrink-0 transition-transform duration-300 group-hover:scale-110"
    />
  ),
  '/contributors': (
    <Users size={15} className="shrink-0 transition-transform duration-300 group-hover:scale-110" />
  ),
  '/support': (
    <MessageCircle
      size={15}
      className="shrink-0 transition-transform duration-300 group-hover:scale-110"
    />
  ),
};

const RESOURCE_ICON_MAP: Record<string, React.ReactNode> = {
  documentation: <BookOpen size={15} className="shrink-0" />,
  github_repo: <GitBranch size={15} className="shrink-0" />,
  guidelines: <BookOpen size={15} className="shrink-0" />,
  faq: <HelpCircle size={15} className="shrink-0" />,
};

export function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  const fallbackLookup = (key: string, baseline: string) => {
    if (!key || key.startsWith('footer.')) {
      return baseline;
    }
    return key;
  };

  const navigationLinks: FooterLink[] = [
    {
      label: fallbackLookup(t('footer.home'), 'Home'),
      href: '/',
      isExternal: false,
      shortcut: 'H',
    },
    {
      label: fallbackLookup(t('footer.generator'), 'Generator'),
      href: '/generator',
      isExternal: false,
      shortcut: 'G',
    },
    {
      label: fallbackLookup(t('footer.compare'), 'Compare'),
      href: '/compare',
      isExternal: false,
      shortcut: 'C',
    },
    {
      label: fallbackLookup(t('footer.customization'), 'Customization'),
      href: '/customize',
      isExternal: false,
      shortcut: 'M',
    },
    {
      label: fallbackLookup(t('footer.contributors'), 'Contributors'),
      href: '/contributors',
      isExternal: false,
      shortcut: 'T',
    },
    {
      label: fallbackLookup(t('footer.support'), 'Support'),
      href: '/support',
      isExternal: false,
      shortcut: 'S',
    },
  ];

  const resourceLinks: FooterLink[] = [
    {
      label: fallbackLookup(t('footer.documentation'), 'Documentation'),
      href: 'https://github.com/JhaSourav07/commitpulse/blob/main/README.md',
      isExternal: true,
    },
    {
      label: fallbackLookup(t('footer.github_repo'), 'GitHub Repository'),
      href: 'https://github.com/JhaSourav07/commitpulse',
      isExternal: true,
    },
    {
      label: fallbackLookup(t('footer.guidelines'), 'Guidelines'),
      href: '/guidelines',
      isExternal: false,
    },
    {
      label: fallbackLookup(t('footer.faq'), 'FAQ'),
      href: '/faq',
      isExternal: false,
    },
  ];

  const socialLinks: SocialLink[] = [
    {
      label: fallbackLookup(t('footer.github'), 'GitHub'),
      href: 'https://github.com/JhaSourav07/commitpulse',
      ariaLabel: 'CommitPulse on GitHub',
      icon: 'github',
    },
    {
      label: fallbackLookup(t('footer.creator_github'), 'Creator on GitHub'),
      href: 'https://github.com/jhasourav07',
      ariaLabel: 'Creator Sourav Jha on GitHub',
      icon: 'creator',
    },
    {
      label: t('footer.discord') === 'footer.discord' ? 'Discord' : t('footer.discord'),
      href: 'https://discord.gg/f84SDraEBH',
      ariaLabel: 'Join CommitPulse on Discord',
      icon: 'discord',
    },
    {
      label: fallbackLookup(t('footer.twitter'), 'Twitter'),
      href: 'https://x.com/JhaSourav07',
      ariaLabel: 'Creator on X',
      icon: 'twitter',
    },
    {
      label: fallbackLookup(t('footer.linkedin'), 'LinkedIn'),
      href: 'https://linkedin.com/in/souravjhahind',
      ariaLabel: 'Creator on LinkedIn',
      icon: 'linkedin',
    },
  ];

  return (
    <footer className="mt-auto border-t border-zinc-200/40 bg-white/50 px-4 py-8 backdrop-blur dark:border-white/5 dark:bg-zinc-950/50 sm:px-6 md:py-12 relative w-full overflow-hidden">
      <div className="absolute top-0 left-12 -z-10 h-72 w-72 rounded-full bg-gradient-to-tr from-violet-500/20 via-fuchsia-500/10 to-cyan-500/20 blur-[100px] pointer-events-none hidden dark:block animate-pulse duration-[6000ms]" />

      <div className="mx-auto max-w-6xl relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
          <div className="flex flex-col items-start lg:pl-4">
            <h2 className="font-extrabold text-3xl tracking-tight text-black dark:text-white bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-400 dark:from-violet-400 dark:via-fuchsia-400 dark:to-cyan-400 bg-clip-text text-transparent dark:drop-shadow-[0_0_35px_rgba(168,85,247,0.95)] drop-shadow-[0_0_15px_rgba(0,0,0,0.15)] filter brightness-110">
              CommitPulse
            </h2>
            <p className="mt-3 text-base text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-[280px]">
              {fallbackLookup(t('footer.tagline'), 'Designed for the elite builder community.')}
            </p>
          </div>

          <div className="flex flex-col items-start md:translate-x-12 lg:translate-x-20 w-full">
            <h3 className="font-bold text-sm uppercase tracking-wider text-black dark:text-white dark:text-zinc-100 mb-4 w-full text-left">
              {fallbackLookup(t('footer.navigation'), 'Navigation')}
            </h3>
            <nav className="flex flex-col gap-3 items-start w-full">
              {navigationLinks.map((link) => (
                <LinkComponent
                  key={link.href}
                  href={link.href}
                  isExternal={link.isExternal}
                  className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors w-full text-left"
                >
                  <span className="flex items-center justify-between gap-2.5 w-full max-w-[160px]">
                    <span className="flex items-center gap-2.5">
                      {NAV_ICON_MAP[link.href]}
                      {link.label}
                    </span>
                    {link.shortcut && (
                      <kbd className="hidden lg:inline-block text-[10px] font-mono opacity-0 group-hover:opacity-40 border border-zinc-400 dark:border-zinc-700 px-1 rounded transition-opacity duration-300">
                        {link.shortcut}
                      </kbd>
                    )}
                  </span>
                </LinkComponent>
              ))}
            </nav>
          </div>

          <div className="flex flex-col items-start md:translate-x-12 lg:translate-x-20 w-full">
            <h3 className="font-bold text-sm uppercase tracking-wider text-black dark:text-white dark:text-zinc-100 mb-4 w-full text-left">
              {fallbackLookup(t('footer.connect'), 'Connect')}
            </h3>
            <div className="flex flex-col gap-3 items-start w-full">
              {socialLinks.map((link) => (
                <LinkComponent
                  key={link.href}
                  href={link.href}
                  isExternal
                  ariaLabel={link.ariaLabel}
                  className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors w-full text-left"
                >
                  <span className="flex items-center justify-start gap-2.5">
                    {SOCIAL_ICON_MAP[link.icon]}
                    {link.label}
                  </span>
                </LinkComponent>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-black/5 dark:border-white/5 my-6 flex flex-col md:flex-row md:items-center md:justify-end gap-4 pt-6 opacity-40 hover:opacity-100 transition-opacity duration-300">
          <div className="flex flex-wrap gap-6 items-center justify-start md:justify-end">
            {resourceLinks.map((link) => (
              <LinkComponent
                key={link.href}
                href={link.href}
                isExternal={link.isExternal}
                className="text-sm text-zinc-600 dark:text-zinc-400"
              >
                <span className="flex items-center gap-2 text-zinc-500 hover:text-black dark:hover:text-white transition-colors">
                  {
                    RESOURCE_ICON_MAP[
                      link.href.includes('README')
                        ? 'documentation'
                        : link.href.includes('guidelines')
                          ? 'guidelines'
                          : link.href.includes('faq')
                            ? 'faq'
                            : 'github_repo'
                    ]
                  }
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    {link.label}
                  </span>
                </span>
              </LinkComponent>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs font-medium text-zinc-500 dark:text-zinc-500">
          <p>
            {t('footer.copyright', { year: currentYear.toString() }).startsWith('footer.')
              ? `© ${currentYear} CommitPulse`
              : t('footer.copyright', { year: currentYear.toString() })}
          </p>
          <p className="flex items-center gap-1 text-zinc-500 dark:text-zinc-500">
            {t('footer.made_with').startsWith('footer.') ? (
              <>
                Made with <span className="text-red-500 animate-pulse">❤️</span> for developers
              </>
            ) : (
              t('footer.made_with')
            )}
          </p>
        </div>
      </div>
    </footer>
  );
}
