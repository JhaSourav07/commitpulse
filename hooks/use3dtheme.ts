'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * Returns the canonical theme key to feed into ContributionCity3D / ViewToggle3D.
 *
 * Resolution order:
 * 1. `forcedTheme` argument (explicit override, e.g. from a URL param or user pref)
 * 2. The `data-theme` attribute on <html>  (set by next-themes or the app's ThemeSwitch)
 * 3. OS-level prefers-color-scheme  → "dark" | "light"
 * 4. Hard fallback → "dark"
 */

// 1. Pure synchronous function to read the initial string value safely
function readThemeFromDOM(): string {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return 'dark';
  }

  const htmlTheme = document.documentElement.getAttribute('data-theme');
  if (htmlTheme) return htmlTheme;

  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  return 'dark';
}

export function use3DTheme(forcedTheme?: string): string {
  // Lazy-initialise from DOM so the very first render is already correct
  const [domTheme, setDomTheme] = useState<string>(() => readThemeFromDOM());

  // Track previous forcedTheme so we can skip redundant re-renders
  const prevForcedRef = useRef(forcedTheme);

  useEffect(() => {
    if (forcedTheme !== undefined) {
      prevForcedRef.current = forcedTheme;
      return;
    }

    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    const handleChange = () => {
      setDomTheme(readThemeFromDOM());
    };

    let observer: MutationObserver | null = null;

    if (typeof MutationObserver !== 'undefined') {
      observer = new MutationObserver(handleChange);

      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme', 'class'],
      });
    }

    let mq: MediaQueryList | null = null;

    if (typeof window.matchMedia === 'function') {
      mq = window.matchMedia('(prefers-color-scheme: dark)');

      if (typeof mq.addEventListener === 'function') {
        mq.addEventListener('change', handleChange);
      } else if (typeof mq.addListener === 'function') {
        mq.addListener(handleChange);
      }
    }

    return () => {
      observer?.disconnect();

      if (mq) {
        if (typeof mq.removeEventListener === 'function') {
          mq.removeEventListener('change', handleChange);
        } else if (typeof mq.removeListener === 'function') {
          mq.removeListener(handleChange);
        }
      }
    };
  }, [forcedTheme]);

  // Derive the final theme synchronously
  return useMemo(
    () => (forcedTheme !== undefined ? forcedTheme : domTheme),
    [forcedTheme, domTheme]
  );
}
