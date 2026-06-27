'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Activity, Moon, Sun, Globe, ChevronDown, Check } from 'lucide-react';
import { useGlowEffect } from '@/hooks/useGlowEffect';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useThemeToggle } from './theme-switch';
import { useTranslation, LANGUAGE_LABELS, type Language } from '@/context/TranslationContext';
import NavbarSearch from '@/components/NavbarSearch';

function GithubMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

const NAV_LINKS = [
  {
    label: 'Generator',
    href: '/generator',
    isExternal: false,
    isPrimary: false,
  },
  {
    label: 'Compare',
    href: '/compare',
    isExternal: false,
    isPrimary: false,
  },
  {
    label: 'Burnout Radar',
    href: '/burnout-analyzer',
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

function LanguageSelector() {
  const { language, changeLanguage, isPending } = useTranslation();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleLanguageClick = (lang: Language) => {
    changeLanguage(lang);
    setIsOpen(false);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!mounted) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 dark:border-white/15 bg-black/5 dark:bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-black/90 dark:text-white/90 opacity-50 select-none">
        <Globe size={14} className="text-zinc-500 dark:text-white/40" />
        <span>English</span>
        <ChevronDown size={12} className="text-zinc-500 dark:text-white/40" />
      </div>
    );
  }

  const currentLabel = LANGUAGE_LABELS[language];
  const isLongLang = currentLabel.length > 6;

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex ${isPending ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center rounded-xl border border-black/10 dark:border-white/15 bg-black/5 dark:bg-white/5 py-1.5 font-semibold text-black/90 dark:text-white/90 hover:bg-black/10 dark:hover:bg-white/10 transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 dark:focus-visible:ring-gray-300 ${
          isLongLang ? 'gap-1 px-2 text-[11px]' : 'gap-1.5 px-2.5 text-xs'
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Select Language"
      >
        <Globe size={14} className="text-zinc-500 dark:text-white/40 animate-none" />
        <span>{currentLabel}</span>
        <ChevronDown
          size={12}
          className={`text-zinc-500 dark:text-white/40 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <ul
          role="listbox"
          aria-label="Language options"
          className="absolute right-0 top-full mt-1.5 z-50 min-w-[130px] rounded-xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0c0c0c]/90 backdrop-blur-md p-1 shadow-lg dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] focus:outline-none animate-in fade-in slide-in-from-top-1 duration-100"
        >
          {Object.entries(LANGUAGE_LABELS).map(([code, label]) => {
            const isSelected = language === code;
            return (
              <li key={code} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    changeLanguage(code as Language);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold transition-colors cursor-pointer focus:outline-none ${
                    isSelected
                      ? 'bg-black/5 dark:bg-white/10 text-black dark:text-white'
                      : 'text-black/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 hover:text-black dark:hover:text-white'
                  }`}
                >
                  <span>{label}</span>
                  {isSelected && (
                    <Check size={12} className="text-black dark:text-white ml-2 shrink-0" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const [isHidden, setIsHidden] = useState(false);

  const pathname = usePathname();

  const { t } = useTranslation();
  const lastScrollYRef = useRef(0);
  // Ref so the scroll handler (stale closure) can always read the current open state.
  const openRef = useRef(false);

  // Keep openRef in sync with open state.
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useKeyboardShortcuts();

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

  useEffect(() => {
    const threshold = 8;
    const currentScrollY = window.scrollY;
    lastScrollYRef.current = currentScrollY;

    const handleScroll = () => {
      const nextScrollY = window.scrollY;
      const delta = nextScrollY - lastScrollYRef.current;

      if (nextScrollY <= 0) {
        setIsHidden(false);
      } else if (delta > threshold && nextScrollY > 72) {
        // Do not hide the navbar while the mobile menu is open — the menu
        // is a child of the header, so hiding it would yank the open dropdown
        // off-screen and confuse the user.
        if (!openRef.current) {
          setIsHidden(true);
        }
      } else if (delta < -threshold) {
        setIsHidden(false);
      }

      lastScrollYRef.current = nextScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleLogoClick = () => {
    setOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getTranslatedLabel = (label: string) => {
    if (label === 'GitHub Repo') return t('navbar.repo');
    if (label === 'Compare') return t('navbar.compare');
    if (label === 'Burnout Radar') return t('navbar.burnout_radar');
    if (label === 'Customization Studio') return t('navbar.customization_studio');
    if (label === 'Generator') return t('navbar.generator');
    return label;
  };

  return (
    <header
      className={`sticky top-0 z-50 px-4 pt-4 sm:px-6 w-full transform-gpu transition-[transform,opacity] duration-300 ease-out ${
        isHidden ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'
      }`}
    >
      <div className="mx-auto max-w-6xl">
        <div
          ref={shellRef}
          className="relative overflow-visible rounded-2xl border border-gray-200/80 bg-white/80 dark:border-white/20 dark:bg-[#0a0a0a]/60 backdrop-blur-xl shadow-sm dark:shadow-[0_8px_30px_rgba(0,0,0,0.8)] transition-all duration-300"
          style={shellVars}
          onMouseEnter={handleMouseEnter}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Glow effects remain untouched */}
          <div
            className="pointer-events-none absolute inset-0 transition-opacity duration-300 ease-out hidden dark:block rounded-2xl overflow-hidden"
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
              aria-label={t('navbar.home')}
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
              <NavbarSearch />
              <LanguageSelector />
              {NAV_LINKS.map((link) => {
                const LinkComponent = link.isExternal ? 'a' : Link;
                const isActive =
                  pathname === link.href || (link.href.startsWith('/#') && pathname === '/');
                const translatedLabel = getTranslatedLabel(link.label);
                const isLong = translatedLabel.length > 12;
                return (
                  <LinkComponent
                    key={link.href}
                    href={link.href}
                    target={link.isExternal ? '_blank' : undefined}
                    rel={link.isExternal ? 'noopener noreferrer' : undefined}
                    className={`relative inline-flex items-center gap-1.5 py-2 font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0a0a0a] whitespace-nowrap shrink-0 ${
                      link.isPrimary
                        ? `rounded-xl bg-gray-900 text-white shadow-md hover:bg-gray-800 hover:-translate-y-0.5 hover:shadow-lg dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200 dark:hover:shadow-[0_4px_20px_rgba(255,255,255,0.2)] focus-visible:ring-gray-950 dark:focus-visible:ring-white ml-2 ${
                            isLong ? 'px-3 text-xs' : 'px-4 text-sm'
                          }`
                        : `rounded-lg focus-visible:ring-gray-400 dark:focus-visible:ring-gray-500 ${
                            isLong ? 'px-2 text-[11px] lg:text-xs' : 'px-3 text-xs lg:text-sm'
                          } ${
                            isActive
                              ? 'text-gray-900 dark:text-white font-semibold'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 dark:text-gray-300 dark:hover:text-white dark:hover:bg-white/10'
                          }`
                    }`}
                  >
                    {link.isExternal && <GithubMark />}
                    {link.label === 'GitHub Repo' ? (
                      <span className="hidden lg:inline">{translatedLabel}</span>
                    ) : (
                      <span>{translatedLabel}</span>
                    )}
                    {isActive && !link.isPrimary && (
                      <span
                        className={`absolute bottom-0 h-0.5 bg-gray-900 dark:bg-white rounded-full animate-in fade-in slide-in-from-bottom-1 duration-250 ${
                          isLong ? 'left-2 right-2' : 'left-3 right-3'
                        }`}
                      />
                    )}
                  </LinkComponent>
                );
              })}

              {/* Separator line between links and theme toggle */}
              <div className="mx-2 h-6 w-px bg-gray-200 dark:bg-white/15" />

              <button
                type="button"
                onClick={toggleTheme}
                className="group inline-flex h-10 w-10 items-center justify-center rounded-xl text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white dark:focus-visible:ring-gray-400 dark:focus-visible:ring-offset-[#0a0a0a]"
                aria-label={t('navbar.theme_toggle')}
                suppressHydrationWarning
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
                aria-label={t('navbar.theme_toggle')}
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
                aria-label={open ? t('navbar.menu_close') : t('navbar.menu_open')}
                aria-expanded={open}
                onClick={() => {
                  const opening = !open;
                  if (opening) {
                    // Snap the navbar into view so the dropdown is immediately
                    // visible and stays visible while the menu is open.
                    setIsHidden(false);
                  }
                  setOpen(opening);
                }}
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
                <li className="mb-2">
                  <NavbarSearch variant="mobile" onNavigate={() => setOpen(false)} />
                </li>
                <li className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-white/10 mb-2">
                  <span className="text-sm font-medium text-black/60 dark:text-white/60">
                    Language / Bhasha
                  </span>
                  <LanguageSelector />
                </li>
                {NAV_LINKS.map((link) => {
                  const LinkComponent = link.isExternal ? 'a' : Link;
                  const isActive =
                    pathname === link.href || (link.href.startsWith('/#') && pathname === '/');
                  return (
                    <li key={link.href}>
                      <LinkComponent
                        href={link.href}
                        target={link.isExternal ? '_blank' : undefined}
                        rel={link.isExternal ? 'noopener noreferrer' : undefined}
                        onClick={() => setOpen(false)}
                        className={`relative inline-flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 dark:focus-visible:ring-offset-[#0a0a0a] ${
                          link.isPrimary
                            ? 'mt-2 bg-gray-900 text-white shadow-md hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200 focus-visible:ring-gray-900 dark:focus-visible:ring-white justify-center'
                            : `focus-visible:ring-gray-400 dark:focus-visible:ring-gray-500 ${
                                isActive
                                  ? 'text-gray-950 dark:text-white bg-black/5 dark:bg-white/10 font-semibold'
                                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 dark:text-gray-300 dark:hover:text-white dark:hover:bg-white/10'
                              }`
                        }`}
                      >
                        {link.isExternal && <GithubMark />}
                        {getTranslatedLabel(link.label)}
                        {isActive && !link.isPrimary && (
                          <span className="absolute left-2 top-3 bottom-3 w-1 bg-gray-950 dark:bg-white rounded-full animate-in fade-in duration-200" />
                        )}
                      </LinkComponent>
                    </li>
                  );
                })}

                <li className="sm:hidden pt-3 mt-3 border-t border-gray-100 dark:border-white/10">
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white dark:focus-visible:ring-gray-500"
                    aria-label={t('navbar.theme_toggle')}
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
