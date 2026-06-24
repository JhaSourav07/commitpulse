'use client';

import Link from 'next/link';
import { useTranslation } from '@/context/TranslationContext';
import {
  GitFork,
  GitBranch,
  MessageCircle,
  User,
  Home,
  Zap,
  GitCompare,
  Sliders,
  Users,
  BookOpen,
  HelpCircle, // ← Added for FAQ
} from 'lucide-react';
import { FaGithub, FaDiscord, FaTwitter, FaLinkedin } from 'react-icons/fa';

interface FooterLink {
  label: string;
  href: string;
  isExternal?: boolean;
}

interface SocialLink {
  label: string;
  href: string;
  ariaLabel: string;
  iconPath: React.ReactNode;
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
  const baseClasses = `group inline-block px-1 rounded transition-all duration-300 hover:-translate-y-[2px] hover:font-medium hover:text-teal-800 dark:hover:text-violet-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-zinc-950 ${className}`;

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
  github: <FaGithub size={15} className="shrink-0" />,
  creator: <User size={15} className="shrink-0" />,
  discord: <FaDiscord size={15} className="shrink-0" />,
  twitter: <FaTwitter size={15} className="shrink-0" />,
  linkedin: <FaLinkedin size={15} className="shrink-0" />,
};

const NAV_ICON_MAP: Record<string, React.ReactNode> = {
  '/': <Home size={15} className="shrink-0" />,
  '/generator': <Zap size={15} className="shrink-0" />,
  '/compare': <GitCompare size={15} className="shrink-0" />,
  '/customize': <Sliders size={15} className="shrink-0" />,
  '/contributors': <Users size={15} className="shrink-0" />,
  '/support': <MessageCircle size={15} className="shrink-0" />,
};

const RESOURCE_ICON_MAP: Record<string, React.ReactNode> = {
  documentation: <BookOpen size={15} className="shrink-0" />,
  github_repo: <GitBranch size={15} className="shrink-0" />,
  guidelines: <BookOpen size={15} className="shrink-0" />,
  faq: <HelpCircle size={15} className="shrink-0" />, // Added
};

export function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  const navigationLinks: FooterLink[] = [
    { label: t('footer.home'), href: '/', isExternal: false },
    { label: t('footer.generator'), href: '/generator', isExternal: false },
    { label: t('footer.compare'), href: '/compare', isExternal: false },
    { label: t('footer.customization'), href: '/customize', isExternal: false },
    { label: t('footer.contributors'), href: '/contributors', isExternal: false },
    { label: t('footer.support'), href: '/support', isExternal: false },
  ];

  const resourceLinks: FooterLink[] = [
    {
      label: t('footer.documentation'),
      href: 'https://github.com/JhaSourav07/commitpulse/blob/main/README.md',
      isExternal: true,
    },
    {
      label: t('footer.github_repo'),
      href: 'https://github.com/JhaSourav07/commitpulse',
      isExternal: true,
    },
    {
      label: t('footer.guidelines'),
      href: '/guidelines',
      isExternal: false,
    },
    {
      label: t('footer.faq'), // ← Added
      href: '/faq',
      isExternal: false,
    },
  ];

  const socialLinks: SocialLink[] = [
    {
      label: t('footer.github'),
      href: 'https://github.com/JhaSourav07/commitpulse',
      ariaLabel: 'CommitPulse on GitHub',
      iconPath: (
        <path
          d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z"
          fill="currentColor"
        />
      ),
    },
    {
      label: t('footer.creator_github'),
      href: 'https://github.com/jhasourav07',
      ariaLabel: 'Creator Sourav Jha on GitHub',
      iconPath: (
        <path
          d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
          fill="currentColor"
        />
      ),
    },
    {
      label: t('footer.discord'),
      href: 'https://discord.gg/f84SDraEBH',
      ariaLabel: 'Join CommitPulse on Discord',
      iconPath: (
        <path
          d="M19.27 4.73a16.14 16.14 0 00-3.97-1.23.13.13 0 00-.14.07c-.17.31-.36.72-.5 1.04a14.86 14.86 0 00-5.32 0c-.14-.32-.34-.73-.52-1.04a.13.13 0 00-.14-.07 16.09 16.09 0 00-3.97 1.23.13.13 0 00-.06.05A16.17 16.17 0 001.15 16.07a.12.12 0 00.05.09 16.43 16.43 0 004.95 2.5.14.14 0 00.15-.05c.42-.57.8-1.18 1.12-1.82a.13.13 0 00-.07-.18 10.74 10.74 0 01-1.55-.74.13.13 0 01-.01-.22c.1-.08.21-.15.31-.23a.13.13 0 01.14-.02 11.75 11.75 0 008.42 0 .13.13 0 01.14.02c.1.08.21.15.31.23a.13.13 0 01-.01.22 10.51 10.51 0 01-1.55.74.13.13 0 00-.07.19c.32.64.7 1.25 1.12 1.82a.13.13 0 00.15.05 16.35 16.35 0 004.95-2.5.12.12 0 00.05-.09 16.12 16.12 0 00-4.1-11.29.12.12 0 00-.06-.05zM8.02 13.52c-.98 0-1.79-.9-1.79-2a1.79 1.79 0 011.79-2c1 0 1.8.9 1.79 2a1.79 1.79 0 01-1.79 2zm7.96 0c-.98 0-1.79-.9-1.79-2a1.79 1.79 0 011.79-2c1 0 1.8.9 1.79 2a1.79 1.79 0 01-1.79 2z"
          fill="currentColor"
        />
      ),
    },
    {
      label: t('footer.twitter'),
      href: 'https://x.com/JhaSourav07',
      ariaLabel: 'Creator on X',
      iconPath: (
        <path
          d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
          fill="currentColor"
        />
      ),
    },
    {
      label: t('footer.linkedin'),
      href: 'https://linkedin.com/in/souravjhahind',
      ariaLabel: 'Creator on LinkedIn',
      iconPath: (
        <path
          d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"
          fill="currentColor"
        />
      ),
    },
  ];

  return (
    <footer className="relative mt-auto border-t border-black/[0.06] bg-gradient-to-b from-white/40 to-white/80 px-4 py-8 backdrop-blur-md dark:border-white/[0.06] dark:from-zinc-950/40 dark:to-zinc-950/80 sm:px-6 md:py-12 overflow-hidden">
      <div className="absolute top-0 left-1/4 -z-10 h-32 w-72 rounded-full bg-teal-500/5 blur-[80px] dark:bg-violet-500/5 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 -z-10 h-32 w-72 rounded-full bg-blue-500/5 blur-[80px] dark:bg-fuchsia-500/5 pointer-events-none" />

      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <div className="flex flex-col items-start lg:col-span-1">
            <h2 className="font-extrabold text-2xl sm:text-3xl tracking-tight bg-gradient-to-r from-teal-600 via-sky-500 to-violet-500 bg-clip-text text-transparent dark:from-teal-400 dark:via-sky-400 dark:to-violet-400">
              CommitPulse
            </h2>
            <p className="mt-3 text-base leading-relaxed text-zinc-600 dark:text-zinc-400 font-normal max-w-xs">
              Designed for the elite builder community.
            </p>
          </div>


          {/* Navigation Section */}
          <div className="flex flex-col items-center sm:items-start">
            <h3 className="font-semibold text-sm text-black dark:text-white mb-3">

              
              {t('footer.navigation')}
            </h3>
            <nav className="flex flex-col gap-2 text-center sm:text-left">
              {navigationLinks.map((link) => (
                <LinkComponent
                  key={link.href}
                  href={link.href}
                  isExternal={link.isExternal}
                  className="text-sm text-zinc-600 dark:text-zinc-400"
                >
                  <span className="flex items-center gap-2">
                    {NAV_ICON_MAP[link.href]}
                    {link.label}
                  </span>
                </LinkComponent>
              ))}
            </nav>
          </div>


          {/* Resources Section */}
          <div className="flex flex-col items-center sm:items-start">
            <h3 className="font-semibold text-sm text-black dark:text-white mb-3">

              {t('footer.resources')}
            </h3>
            <nav className="flex flex-col gap-2 text-center sm:text-left">
              {resourceLinks.map((link) => (
                <LinkComponent
                  key={link.href}
                  href={link.href}
                  isExternal={link.isExternal}
                  className="text-sm text-zinc-600 dark:text-zinc-400"
                >
                  <span className="flex items-center gap-2">
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
                    {link.label}
                  </span>
                </LinkComponent>
              ))}
            </nav>
          </div>


          {/* Connect Section */}
          <div className="flex flex-col items-center sm:items-start">
            <h3 className="font-semibold text-sm text-black dark:text-white mb-3">

              {t('footer.connect')}
            </h3>
            <div className="flex flex-col gap-2.5 text-center sm:text-left">
              {socialLinks.map((link) => (
                <LinkComponent
                  key={link.href}
                  href={link.href}
                  isExternal
                  ariaLabel={link.ariaLabel}
                  className="text-sm text-zinc-600 dark:text-zinc-400 group/item"
                >

                  <span className="flex items-center gap-2">
                    {SOCIAL_ICON_MAP[link.icon]}
                    {link.label}

                  </span>
                </LinkComponent>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-black/5 dark:border-white/5" />

        <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-zinc-400/70 dark:text-zinc-500/60 font-light select-none">
          <div className="flex flex-col gap-0.5">
            <p> &copy;{currentYear} CommitPulse All rights reserved</p>
          </div>
          <p className="text-zinc-400 dark:text-zinc-500 font-normal">{t('footer.made_with')}</p>
        </div>
      </div>
    </footer>
  );
}
