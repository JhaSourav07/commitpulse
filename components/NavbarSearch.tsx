'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';
import { useSiteSearch } from '@/hooks/useSiteSearch';
import type { SearchableDomain } from '@/lib/search/domains';

const CATEGORY_STYLES: Record<SearchableDomain['category'], string> = {
  Dashboard: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
  Tools: 'text-cyan-600 dark:text-cyan-400 bg-cyan-500/10',
  Customize: 'text-purple-600 dark:text-purple-400 bg-purple-500/10',
  Community: 'text-amber-600 dark:text-amber-400 bg-amber-500/10',
  Docs: 'text-blue-600 dark:text-blue-400 bg-blue-500/10',
};

function isExternalHref(href: string): boolean {
  return href.startsWith('http://') || href.startsWith('https://');
}

interface NavbarSearchProps {
  /** Renders the full-width inline variant (used in mobile dropdown) */
  variant?: 'desktop' | 'mobile';
  onNavigate?: () => void;
}

export default function NavbarSearch({ variant = 'desktop', onNavigate }: NavbarSearchProps) {
  const { query, setQuery, results, hasQuery, clear } = useSiteSearch();
  const [open, setOpen] = useState(variant === 'mobile');
  const [activeIndex, setActiveIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Clamp the highlighted index against the current result count instead of
  // syncing it via an effect/ref — this is a pure derivation, safe to do
  // directly during render.
  const safeActiveIndex = results.length > 0 ? Math.min(activeIndex, results.length - 1) : 0;

  // Global Cmd/Ctrl+K shortcut to open & focus the search (desktop variant only)
  useEffect(() => {
    if (variant !== 'desktop') return;

    function handleGlobalKeyDown(e: KeyboardEvent) {
      const isTypingTarget =
        e.target instanceof HTMLElement &&
        (e.target.tagName === 'INPUT' ||
          e.target.tagName === 'TEXTAREA' ||
          e.target.isContentEditable);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(true);
        requestAnimationFrame(() => inputRef.current?.focus());
        return;
      }

      if (e.key === '/' && !isTypingTarget) {
        e.preventDefault();
        setOpen(true);
        requestAnimationFrame(() => inputRef.current?.focus());
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [variant]);

  // Close the dropdown (desktop only) when clicking outside
  useEffect(() => {
    if (variant !== 'desktop') return;

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [variant]);

  function navigateTo(domain: SearchableDomain) {
    if (isExternalHref(domain.href)) {
      window.open(domain.href, '_blank', 'noopener,noreferrer');
    } else {
      window.location.assign(domain.href);
    }
    clear();
    setOpen(variant === 'mobile'); // keep mobile panel open-state as-is, close desktop popover
    onNavigate?.();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      if (variant === 'desktop') {
        setOpen(false);
        inputRef.current?.blur();
      } else {
        clear();
      }
      return;
    }

    if (!hasQuery || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const chosen = results[safeActiveIndex];
      if (chosen) navigateTo(chosen.domain);
    }
  }

  const showDropdown = hasQuery && (variant === 'mobile' || open);

  return (
    <div ref={containerRef} className={variant === 'desktop' ? 'relative' : 'relative w-full'}>
      {/* Desktop: icon-trigger that expands into an input */}
      {variant === 'desktop' ? (
        <div
          className={`flex items-center overflow-hidden rounded-xl border transition-all duration-300 ${
            open
              ? 'w-56 border-black/10 bg-black/5 dark:border-white/15 dark:bg-white/5'
              : 'w-10 border-transparent bg-transparent'
          }`}
        >
          <button
            type="button"
            aria-label="Search domains"
            onClick={() => {
              setOpen(true);
              // Wait for width transition to start before focusing
              requestAnimationFrame(() => inputRef.current?.focus());
            }}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <Search size={18} />
          </button>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setOpen(true)}
            placeholder="Search domains..."
            aria-label="Search domains, tools, and pages"
            className={`h-9 flex-1 bg-transparent pr-2 text-sm text-black outline-none placeholder:text-gray-400 dark:text-white dark:placeholder:text-gray-500 transition-opacity duration-200 ${
              open ? 'opacity-100' : 'opacity-0'
            }`}
          />
          {open && hasQuery && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={clear}
              className="mr-1.5 flex-shrink-0 rounded-full p-0.5 text-gray-400 hover:text-gray-700 dark:hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>
      ) : (
        // Mobile: always-visible inline search field
        <div className="relative flex items-center rounded-xl border border-black/10 bg-black/5 px-3 dark:border-white/15 dark:bg-white/5">
          <Search size={16} className="flex-shrink-0 text-gray-400 dark:text-gray-500" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search domains..."
            aria-label="Search domains, tools, and pages"
            className="h-11 w-full bg-transparent px-2 text-sm text-black outline-none placeholder:text-gray-400 dark:text-white dark:placeholder:text-gray-500"
          />
          {hasQuery && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={clear}
              className="flex-shrink-0 rounded-full p-1 text-gray-400 hover:text-gray-700 dark:hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {/* Results dropdown */}
      {showDropdown && (
        <div
          role="listbox"
          aria-label="Search results"
          className={`z-50 max-h-80 overflow-y-auto rounded-2xl border border-black/10 bg-white/95 p-1.5 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#0a0a0a]/95 ${
            variant === 'desktop' ? 'absolute right-0 mt-2 w-72' : 'mt-2 w-full'
          }`}
        >
          {results.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
              No domains found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            results.map((result, idx) => {
              const { domain } = result;
              const isActive = idx === safeActiveIndex;
              return (
                <button
                  key={domain.id}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => navigateTo(domain)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                    isActive
                      ? 'bg-gray-100 dark:bg-white/10'
                      : 'hover:bg-gray-50 dark:hover:bg-white/5'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                        {domain.title}
                      </span>
                      <span
                        className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${CATEGORY_STYLES[domain.category]}`}
                      >
                        {domain.category}
                      </span>
                    </div>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                      {domain.description}
                    </p>
                  </div>
                  <ArrowRight
                    size={14}
                    className={`flex-shrink-0 text-gray-400 transition-transform ${isActive ? 'translate-x-0.5' : ''}`}
                  />
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
