'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const SHORTCUT_ROUTES: Record<string, string> = {
  d: '/',
  c: '/contributors',
  p: '/compare',
  u: '/customize',
};

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    target.isContentEditable
  );
}

interface UseKeyboardShortcutsOptions {
  onOpenShortcuts?: () => void;
}

// Global "g then key" quick-nav shortcuts. Navigates via the App Router, so it
// must be mounted within a Next.js App Router context (useRouter throws otherwise).

export function useKeyboardShortcuts(options?: UseKeyboardShortcutsOptions) {
  const router = useRouter();
  const waitingForSecondKey = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const resetShortcut = () => {
      waitingForSecondKey.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;

      // ? opens shortcuts modal
      if (!event.ctrlKey && !event.metaKey && !event.altKey && event.key === '?') {
        event.preventDefault();
        options?.onOpenShortcuts?.();
        return;
      }

      if (event.ctrlKey || event.metaKey || event.altKey) return;

      const key = event.key.toLowerCase();

      if (!waitingForSecondKey.current) {
        if (key === 'g') {
          waitingForSecondKey.current = true;
          timeoutRef.current = setTimeout(() => {
            waitingForSecondKey.current = false;
            timeoutRef.current = null;
          }, 1000);
        }
        return;
      }

      const route = SHORTCUT_ROUTES[key];
      if (route) {
        event.preventDefault();
        router.push(route);
      }
      resetShortcut();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      resetShortcut();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [router, options]);
}
