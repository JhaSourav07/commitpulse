'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, X, Activity, Moon, Sun } from 'lucide-react';
import { useGlowEffect } from '@/hooks/useGlowEffect';

function GithubMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

const NAV_LINKS = [
  {
    label: 'GitHub Repo',
    href: 'https://github.com/JhaSourav07/commitpulse',
  },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return true;

    return localStorage.getItem('theme') !== 'light';
  });

  const { shellRef, shellVars, handleMouseEnter, handleMouseMove, handleMouseLeave } =
    useGlowEffect();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');

    const handleBreakpointChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setOpen(false);
      }
    };

    // Defer the initial check so it doesn't cause a synchronous setState
    // inside the effect body (which would trigger cascading re-renders).
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
          className="relative overflow-hidden rounded-2xl border border-white/25 bg-black/45 backdrop-blur-xl shadow-[0_14px_40px_rgba(0,0,0,0.45)]"
          style={shellVars}
          onMouseEnter={handleMouseEnter}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <div
            className="pointer-events-none absolute inset-0 transition-opacity duration-300 ease-out"
            style={{
              opacity: 'var(--glow-opacity)',
              background:
                'radial-gradient(180px 105px at var(--mx) var(--my), rgba(255,255,255,0.26), rgba(191,219,254,0.18) 30%, rgba(244,114,182,0.1) 48%, rgba(0,0,0,0) 68%)',
            }}
          />
          <div className="pointer-events-none absolute inset-0 rounded-2xl border border-white/20" />
          <div
            className="pointer-events-none absolute inset-0 rounded-2xl p-px transition-opacity duration-300 ease-out"
            style={{
              opacity: 'var(--border-opacity)',
              background:
                'radial-gradient(150px 90px at var(--mx) var(--my), rgba(255,255,255,0.98), rgba(186,230,253,0.64) 32%, rgba(196,181,253,0.34) 50%, rgba(0,0,0,0) 68%)',
              WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
            }}
          />
          <nav className="relative flex items-center justify-between px-4 py-3 sm:px-6">
            <Link
              href="/"
              aria-label="Go to home"
              className="group inline-flex items-center gap-3"
              onClick={handleLogoClick}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/35 bg-white/10 text-white shadow-[0_0_25px_rgba(255,255,255,0.22)] transition-transform duration-300 group-hover:scale-105">
                <Activity size={19} />
              </span>
              <span className="text-base font-semibold tracking-[0.08em] text-white sm:text-lg">
                CommitPulse
              </span>
            </Link>

            <div className="hidden items-center gap-3 md:flex">
              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white transition hover:bg-white/10"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/90 transition hover:border-white/45 hover:bg-white/10"
                >
                  <GithubMark />
                  {link.label}
                </a>
              ))}
            </div>

            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 p-2 text-white/90 transition hover:bg-white/10"
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              onClick={() => setOpen((prev) => !prev)}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </nav>

          {open ? (
            <div className="border-t border-white/10 px-4 py-3 md:hidden">
              <ul className="space-y-2">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setOpen(false)}
                      className="inline-flex w-full items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/90 transition hover:border-white/45 hover:bg-white/10"
                    >
                      <GithubMark />
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
