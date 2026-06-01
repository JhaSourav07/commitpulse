'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, X, Activity, Moon, Sun } from 'lucide-react';
import { useGlowEffect } from '@/hooks/useGlowEffect';
import { useThemeToggle } from './theme-switch';

function GithubMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

const NAV_LINKS = [
  {
    label: 'Compare',
    href: '/compare',
    isExternal: false,
    isPrimary: false,
  },
  {
    label: 'Customization Studio',
    href: '/#customization-studio',
    isExternal: false,
    isPrimary: false,
  },
  {
    label: 'GitHub Repo',
    href: 'https://github.com/JhaSourav07/commitpulse',
    isExternal: true,
    isPrimary: true,
  },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const { shellRef, shellVars, handleMouseEnter, handleMouseMove, handleMouseLeave } =
    useGlowEffect();
  const { isDark, mounted, toggleTheme } = useThemeToggle({
    variant: 'circle',
    start: 'top-right',
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');

    const handleBreakpointChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setOpen(false);
      }
    };

    const initialCheckTimer = setTimeout(() => {
      if (mediaQuery.matches) {
        setOpen(false);
      }
    }, 0);

    mediaQuery.addEventListener('change', handleBreakpointChange);

    return () => {
      clearTimeout(initialCheckTimer);
      mediaQuery.removeEventListener('change', handleBreakpointChange);
    };
  }, []);

  const handleLogoClick = () => {
    setOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="relative z-50 px-4 pt-4 sm:px-6 w-full">
      <div className="mx-auto max-w-6xl">
        <div
          ref={shellRef}
          className="relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white/80 dark:border-white/20 dark:bg-[#0a0a0a]/60 backdrop-blur-xl shadow-sm dark:shadow-[0_8px_30px_rgba(0,0,0,0.8)] transition-all duration-300"
          style={shellVars}
          onMouseEnter={handleMouseEnter}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Glow effects remain untouched */}
          <div
            className="pointer-events-none absolute inset-0 transition-opacity duration-300 ease-out hidden dark:block"
            style={{
              opacity: 'var(--glow-opacity)',
              background:
                'radial-gradient(180px 105px at var(--mx) var(--my), rgba(255,255,255,0.20), rgba(191,219,254,0.12) 30%, rgba(244,114,182,0.08) 48%, rgba(0,0,0,0) 68%)',
            }}
          />
          <div className="pointer-events-none absolute inset-0 rounded-2xl border border-black/5 dark:border-white/10" />
          <div
            className="pointer-events-none absolute inset-0 rounded-2xl p-px transition-opacity duration-300 ease-out hidden dark:block"
            style={{
              opacity: 'var(--border-opacity)',
              background:
                'radial-gradient(150px 90px at var(--mx) var(--my), rgba(255,255,255,0.8), rgba(186,230,253,0.5) 32%, rgba(196,181,253,0.2) 50%, rgba(0,0,0,0) 68%)',
              WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
            }}
          />

          <nav className="relative flex items-center justify-between px-4 py-3 sm:px-6">
            <Link
              href="/"
              aria-label="Go to home"
              className="group inline-flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 rounded-xl dark:focus-visible:ring-gray-300 dark:focus-visible:ring-offset-[#0a0a0a]"
              onClick={handleLogoClick}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-300 text-gray-800 shadow-sm dark:border-white/20 dark:from-white/10 dark:to-white/5 dark:text-white transition-transform duration-300 group-hover:scale-105 group-hover:shadow-md">
                <Activity
                  size={19}
                  className="transition-transform duration-300 group-hover:rotate-6"
                />
              </span>
              {/* Added Text Gradient here */}
              <span className="text-base font-bold tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 sm:text-lg">
                CommitPulse
              </span>
            </Link>

            <div className="hidden items-center gap-2 md:flex">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target={link.isExternal ? '_blank' : undefined}
                  rel={link.isExternal ? 'noopener noreferrer' : undefined}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0a0a0a] ${
                    link.isPrimary
                      ? 'rounded-xl bg-gray-900 text-white shadow-md hover:bg-gray-800 hover:-translate-y-0.5 hover:shadow-lg dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200 dark:hover:shadow-[0_4px_20px_rgba(255,255,255,0.2)] focus-visible:ring-gray-900 dark:focus-visible:ring-white ml-2'
                      : 'rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 dark:text-gray-300 dark:hover:text-white dark:hover:bg-white/10 focus-visible:ring-gray-400 dark:focus-visible:ring-gray-500'
                  }`}
                >
                  {link.isExternal && <GithubMark />}
                  {link.label}
                </a>
              ))}

              {/* Separator line between links and theme toggle */}
              <div className="mx-2 h-6 w-px bg-gray-200 dark:bg-white/15" />

              <button
                type="button"
                onClick={toggleTheme}
                className="group inline-flex h-10 w-10 items-center justify-center rounded-xl text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white dark:focus-visible:ring-gray-400 dark:focus-visible:ring-offset-[#0a0a0a]"
                aria-label="Toggle theme"
              >
                {mounted ? (
                  isDark ? (
                    <Moon
                      size={18}
                      className="transition-transform duration-300 group-hover:-rotate-12"
                    />
                  ) : (
                    <Sun
                      size={18}
                      className="transition-transform duration-300 group-hover:rotate-45"
                    />
                  )
                ) : (
                  <span className="w-[18px] h-[18px]" />
                )}
              </button>
            </div>

            {/* Mobile Menu Buttons */}
            <div className="md:hidden inline-flex items-center justify-center gap-1">
              <button
                type="button"
                onClick={toggleTheme}
                className="group hidden sm:inline-flex h-10 w-10 items-center justify-center rounded-xl text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
                aria-label="Toggle theme"
              >
                {mounted ? (
                  isDark ? (
                    <Moon
                      size={18}
                      className="transition-transform duration-300 group-hover:-rotate-12"
                    />
                  ) : (
                    <Sun
                      size={18}
                      className="transition-transform duration-300 group-hover:rotate-45"
                    />
                  )
                ) : (
                  <span className="w-[18px] h-[18px]" />
                )}
              </button>
              <button
                type="button"
                className="md:hidden inline-flex items-center justify-center rounded-xl p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
                aria-label={open ? 'Close menu' : 'Open menu'}
                aria-expanded={open}
                onClick={() => setOpen((prev) => !prev)}
              >
                {open ? (
                  <X size={20} className="transition-transform duration-300 rotate-90 scale-110" />
                ) : (
                  <Menu size={20} className="transition-transform duration-300 hover:scale-110" />
                )}
              </button>
            </div>
          </nav>

          {/* Mobile Dropdown Menu */}
          {open ? (
            <div className="border-t border-gray-100 dark:border-white/10 px-4 py-4 md:hidden">
              <ul className="space-y-1">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      target={link.isExternal ? '_blank' : undefined}
                      rel={link.isExternal ? 'noopener noreferrer' : undefined}
                      onClick={() => setOpen(false)}
                      className={`inline-flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 dark:focus-visible:ring-offset-[#0a0a0a] ${
                        link.isPrimary
                          ? 'mt-2 bg-gray-900 text-white shadow-md hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200 focus-visible:ring-gray-900 dark:focus-visible:ring-white justify-center'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 dark:text-gray-300 dark:hover:text-white dark:hover:bg-white/10 focus-visible:ring-gray-400 dark:focus-visible:ring-gray-500'
                      }`}
                    >
                      {link.isExternal && <GithubMark />}
                      {link.label}
                    </a>
                  </li>
                ))}

                <li className="sm:hidden pt-3 mt-3 border-t border-gray-100 dark:border-white/10">
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white dark:focus-visible:ring-gray-500"
                    aria-label="Toggle theme"
                  >
                    {mounted ? (
                      isDark ? (
                        <Moon size={18} />
                      ) : (
                        <Sun size={18} />
                      )
                    ) : (
                      <span className="w-[18px] h-[18px]" />
                    )}
                    {mounted ? (isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode') : 'Theme'}
                  </button>
                </li>
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
