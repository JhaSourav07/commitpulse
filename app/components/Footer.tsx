'use client';

import Link from 'next/link';

const GithubIcon = () => (
  <svg height="14" width="14" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
  </svg>
);

const DiscordIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994.021-.04.001-.088-.041-.104a13.1 13.1 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z" />
  </svg>
);

const XIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.259 5.633L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
  </svg>
);

const ZapIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M13 2 L3 14 L12 14 L11 22 L21 10 L12 10 L13 2 Z" />
  </svg>
);

const PRODUCT_LINKS = [
  { label: 'Dashboard', href: '/dashboard', internal: true },
  { label: 'Badge Generator', href: '/', internal: true },
  { label: 'Contributors', href: '/contributors', internal: true },
  { label: 'How It Works', href: '/#guide', internal: true },
  {
    label: 'Changelog',
    href: 'https://github.com/JhaSourav07/commitpulse/releases',
    badge: 'New',
    internal: false,
  },
];

const RESOURCE_LINKS = [
  {
    label: 'Documentation',
    href: 'https://github.com/JhaSourav07/commitpulse/blob/main/README.md',
  },
  { label: 'GitHub Repo', href: 'https://github.com/JhaSourav07/commitpulse' },
  { label: 'Community', href: 'https://discord.gg/Cb73bS79j' },
  { label: 'API', href: '/api/streak?user=torvalds' },
];

const CONNECT_LINKS = [
  { label: 'Creator', href: 'https://github.com/jhasourav07' },
  { label: 'Report a Bug', href: 'https://github.com/JhaSourav07/commitpulse/issues' },
  { label: 'Discord', href: 'https://discord.gg/Cb73bS79j' },
  { label: 'Privacy Policy', href: '/privacy' },
];

export function Footer() {
  return (
    <footer className="relative mt-20 overflow-hidden border-t border-black/[0.07] dark:border-white/[0.07] bg-transparent pb-24 md:pb-8 pt-14">
      {/* Subtle green ambient glow at bottom */}
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-[180px] w-[500px] -translate-x-1/2 rounded-full bg-[#00ffaa]/[0.04] blur-[80px]" />

      <div className="relative mx-auto max-w-6xl px-6">
        {/* TOP GRID */}
        <div className="grid gap-10 border-b border-black/[0.06] pb-10 dark:border-white/[0.06] sm:grid-cols-2 lg:grid-cols-[1.8fr_1fr_1fr_1fr]">
          {/* Brand column */}
          <div className="sm:col-span-2 lg:col-span-1">
            {/* Logo */}
            <div className="mb-3 flex items-center gap-2.5">
              <div className="flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-[#00ffaa]/30 bg-white dark:bg-[#0d0d0d] text-[#00ffaa]">
                <ZapIcon />
              </div>
              <span className="text-[15px] font-bold tracking-tight text-black dark:text-white">
                CommitPulse
              </span>
            </div>

            <p className="mb-5 max-w-[210px] text-[12.5px] leading-relaxed text-zinc-500 dark:text-zinc-500">
              Visualize your GitHub contributions as stunning 3D isometric monoliths. Built for the
              elite builder community.
            </p>

            {/* Status pill */}
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.07] px-3 py-1.5">
              <span className="relative flex h-[6px] w-[6px]">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-40" />
                <span className="relative inline-flex h-[6px] w-[6px] rounded-full bg-emerald-500" />
              </span>
              <span className="text-[11.5px] font-medium text-emerald-500">
                All systems operational
              </span>
            </div>

            {/* Social icons */}
            <div className="mb-4 flex gap-2">
              {[
                {
                  href: 'https://github.com/JhaSourav07/commitpulse',
                  label: 'GitHub',
                  Icon: GithubIcon,
                },
                { href: 'https://discord.gg/Cb73bS79j', label: 'Discord', Icon: DiscordIcon },
                { href: 'https://twitter.com', label: 'X / Twitter', Icon: XIcon },
              ].map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="flex h-[32px] w-[32px] items-center justify-center rounded-[7px] border border-black/10 bg-black/[0.02] text-zinc-500 transition-all duration-200 hover:-translate-y-[1px] hover:border-[#00ffaa]/30 hover:bg-[#00ffaa]/[0.07] hover:text-[#00ffaa] dark:border-white/[0.08] dark:bg-white/[0.02] dark:text-zinc-500 dark:hover:border-[#00ffaa]/30 dark:hover:text-[#00ffaa]"
                >
                  <Icon />
                </a>
              ))}
            </div>

            {/* Star CTA */}
            <a
              href="https://github.com/JhaSourav07/commitpulse"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-[7px] border border-black/10 bg-black/[0.02] px-3 py-1.5 text-[12px] font-medium text-zinc-500 transition-all duration-200 hover:border-black/20 hover:text-black dark:border-white/[0.08] dark:bg-white/[0.02] dark:text-zinc-400 dark:hover:border-white/20 dark:hover:text-white"
            >
              <GithubIcon />
              Star on GitHub
              <span className="rounded px-1.5 py-[1px] text-[11px] font-semibold bg-black/[0.05] text-zinc-500 dark:bg-white/[0.07] dark:text-zinc-400">
                ★ 214
              </span>
            </a>
          </div>

          {/* Product links */}
          <div>
            <p className="mb-4 text-[10.5px] font-bold uppercase tracking-[0.12em] text-black/40 dark:text-white/35">
              Product
            </p>
            <ul className="flex flex-col gap-[10px]">
              {PRODUCT_LINKS.map(({ label, href, badge, internal }) => (
                <li key={label}>
                  {internal ? (
                    <Link
                      href={href}
                      className="flex items-center gap-2 text-[13px] text-zinc-500 transition-colors duration-150 hover:text-black dark:text-zinc-500 dark:hover:text-white"
                    >
                      {label}
                      {badge && (
                        <span className="rounded border border-[#00ffaa]/25 bg-[#00ffaa]/10 px-1.5 py-[2px] text-[9px] font-bold uppercase tracking-[0.05em] text-[#00ffaa]">
                          {badge}
                        </span>
                      )}
                    </Link>
                  ) : (
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-[13px] text-zinc-500 transition-colors duration-150 hover:text-black dark:text-zinc-500 dark:hover:text-white"
                    >
                      {label}
                      {badge && (
                        <span className="rounded border border-[#00ffaa]/25 bg-[#00ffaa]/10 px-1.5 py-[2px] text-[9px] font-bold uppercase tracking-[0.05em] text-[#00ffaa]">
                          {badge}
                        </span>
                      )}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Resources links */}
          <div>
            <p className="mb-4 text-[10.5px] font-bold uppercase tracking-[0.12em] text-black/40 dark:text-white/35">
              Resources
            </p>
            <ul className="flex flex-col gap-[10px]">
              {RESOURCE_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[13px] text-zinc-500 transition-colors duration-150 hover:text-black dark:text-zinc-500 dark:hover:text-white"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect links */}
          <div>
            <p className="mb-4 text-[10.5px] font-bold uppercase tracking-[0.12em] text-black/40 dark:text-white/35">
              Connect
            </p>
            <ul className="flex flex-col gap-[10px]">
              {CONNECT_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[13px] text-zinc-500 transition-colors duration-150 hover:text-black dark:text-zinc-500 dark:hover:text-white"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* BOTTOM BAR */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-6">
          <p className="flex items-center gap-1.5 text-[12px] text-zinc-400 dark:text-zinc-600">
            © 2026 CommitPulse
            <span className="text-zinc-300 dark:text-zinc-700">·</span>
            Made with <span className="text-red-400">♥</span> for developers worldwide.
          </p>

          <div className="flex items-center gap-5">
            {[
              { label: 'Privacy', href: '/privacy', internal: true },
              { label: 'Terms', href: '/terms', internal: true },
              {
                label: 'GitHub',
                href: 'https://github.com/JhaSourav07/commitpulse',
                internal: false,
              },
            ].map(({ label, href, internal }, i, arr) => (
              <div key={label} className="flex items-center gap-5">
                {internal ? (
                  <Link
                    href={href}
                    className="text-[12px] text-zinc-400 transition-colors duration-150 hover:text-zinc-600 dark:text-zinc-600 dark:hover:text-zinc-400"
                  >
                    {label}
                  </Link>
                ) : (
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[12px] text-zinc-400 transition-colors duration-150 hover:text-zinc-600 dark:text-zinc-600 dark:hover:text-zinc-400"
                  >
                    {label}
                  </a>
                )}
                {i < arr.length - 1 && (
                  <span className="h-[11px] w-[1px] bg-black/[0.07] dark:bg-white/[0.07]" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
