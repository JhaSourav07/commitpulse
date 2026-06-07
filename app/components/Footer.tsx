import Link from 'next/link';

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

const navigationLinks: FooterLink[] = [
  { label: 'Home', href: '/', isExternal: false },
  { label: 'Generator', href: '/generator', isExternal: false },
  { label: 'Compare', href: '/compare', isExternal: false },
  { label: 'Customization', href: '/customize', isExternal: false },
  { label: 'Contributors', href: '/contributors', isExternal: false },
];

const resourceLinks: FooterLink[] = [
  {
    label: 'Documentation',
    href: 'https://github.com/JhaSourav07/commitpulse/blob/main/README.md',
    isExternal: true,
  },
  {
    label: 'GitHub Repository',
    href: 'https://github.com/JhaSourav07/commitpulse',
    isExternal: true,
  },
];

const socialLinks: SocialLink[] = [
  {
    label: 'GitHub',
    href: 'https://github.com/JhaSourav07/commitpulse',
    ariaLabel: 'CommitPulse on GitHub',
    icon: 'github',
  },
  {
    label: 'Creator on GitHub',
    href: 'https://github.com/jhasourav07',
    ariaLabel: 'Creator Sourav Jha on GitHub',
    icon: 'creator',
  },
  {
    label: 'Discord',
    href: 'https://discord.gg/Cb73bS79j',
    ariaLabel: 'Join CommitPulse on Discord',
    icon: 'discord',
  },
  {
    label: 'X',
    href: 'https://x.com/JhaSourav07',
    ariaLabel: 'Creator on X',
    icon: 'twitter',
  },
  {
    label: 'LinkedIn',
    href: 'https://linkedin.com/in/souravjhahind',
    ariaLabel: 'Creator on LinkedIn',
    icon: 'linkedin',
  },
];

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

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-black/5 bg-white/50 px-4 py-8 backdrop-blur dark:border-white/5 dark:bg-zinc-950/50 sm:px-6 md:py-12">
      <div className="mx-auto max-w-6xl">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
          {/* Brand Section */}
          <div className="flex flex-col items-center sm:items-start lg:col-span-1">
            <h2 className="font-bold text-lg text-black dark:text-white">CommitPulse</h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Designed for the elite builder community.
            </p>
          </div>

          {/* Navigation Section */}
          <div className="flex flex-col items-center sm:items-start">
            <h3 className="font-semibold text-sm text-black dark:text-white mb-3">Navigation</h3>
            <nav className="flex flex-col gap-2 text-center sm:text-left">
              {navigationLinks.map((link) => (
                <LinkComponent
                  key={link.href}
                  href={link.href}
                  isExternal={link.isExternal}
                  className="text-sm text-zinc-600 dark:text-zinc-400"
                >
                  {link.label}
                </LinkComponent>
              ))}
            </nav>
          </div>

          {/* Resources Section */}
          <div className="flex flex-col items-center sm:items-start">
            <h3 className="font-semibold text-sm text-black dark:text-white mb-3">Resources</h3>
            <nav className="flex flex-col gap-2 text-center sm:text-left">
              {resourceLinks.map((link) => (
                <LinkComponent
                  key={link.href}
                  href={link.href}
                  isExternal={link.isExternal}
                  className="text-sm text-zinc-600 dark:text-zinc-400"
                >
                  {link.label}
                </LinkComponent>
              ))}
            </nav>
          </div>

          {/* Connect Section */}
          <div className="flex flex-col items-center sm:items-start">
            <h3 className="font-semibold text-sm text-black dark:text-white mb-3">Connect</h3>
            <div className="flex flex-col gap-2">
              {socialLinks.map((link) => (
                <LinkComponent
                  key={link.href}
                  href={link.href}
                  isExternal
                  ariaLabel={link.ariaLabel}
                  className="text-sm text-zinc-600 dark:text-zinc-400"
                >
                  {link.label}
                </LinkComponent>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-black/5 dark:border-white/5" />

        {/* Bottom Section */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-zinc-500 dark:text-zinc-500">
          <p>© {currentYear} CommitPulse. All rights reserved.</p>
          <p>Made with ❤️ for developers</p>
        </div>
      </div>
    </footer>
  );
}
