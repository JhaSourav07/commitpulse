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
      icon: 'github',
    },
    {
      label: t('footer.creator_github'),
      href: 'https://github.com/jhasourav07',
      ariaLabel: 'Creator Sourav Jha on GitHub',
      icon: 'creator',
    },
    {
      label: t('footer.discord'),
      href: 'https://discord.gg/f84SDraEBH',
      ariaLabel: 'Join CommitPulse on Discord',
      icon: 'discord',
    },
    {
      label: t('footer.twitter'),
      href: 'https://x.com/JhaSourav07',
      ariaLabel: 'Creator on X',
      icon: 'twitter',
    },
    {
      label: t('footer.linkedin'),
      href: 'https://linkedin.com/in/souravjhahind',
      ariaLabel: 'Creator on LinkedIn',
      icon: 'linkedin',
    },
  ];

  return (
    <footer className="mt-auto border-t border-black/5 bg-white/50 px-4 py-8 backdrop-blur dark:border-white/5 dark:bg-zinc-950/50 sm:px-6 md:py-12">
      <div className="mx-auto max-w-6xl">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
          {/* Brand Section */}
          <div className="flex flex-col items-start lg:col-span-1">
            <h2 className="font-bold text-lg text-black dark:text-white">CommitPulse</h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{t('footer.tagline')}</p>
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
            <div className="flex flex-col gap-2 text-center sm:text-left">
              {socialLinks.map((link) => (
                <LinkComponent
                  key={link.href}
                  href={link.href}
                  isExternal
                  ariaLabel={link.ariaLabel}
                  className="text-sm text-zinc-600 dark:text-zinc-400"
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

        {/* Divider */}
        <div className="border-t border-black/5 dark:border-white/5" />

        {/* Bottom Section */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-zinc-500 dark:text-zinc-500">
          <p>{t('footer.copyright', { year: currentYear.toString() })}</p>
          <p>{t('footer.made_with')}</p>
        </div>
      </div>
    </footer>
  );
}
