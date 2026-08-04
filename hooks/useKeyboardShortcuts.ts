'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const SHORTCUT_ROUTES: Record<string, string> = {
  h: '/',
  d: '/',
  r: 'https://github.com/JhaSourav07/commitpulse',
  p: '/customize',
  c: '/contributors',
  u: '/customize',
};

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  const role = target.getAttribute('role')?.toLowerCase();
  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    target.isContentEditable ||
    role === 'textbox' ||
    role === 'combobox' ||
    role === 'searchbox'
  );
}

export interface UseKeyboardShortcutsOptions {
  onOpenShortcuts?: () => void;
  onFocusSearch?: () => void;
  onToggleCommandPalette?: () => void;
  onCloseActiveModal?: () => void;
  onSuggestRepo?: () => void;
}

// Global keyboard shortcuts system:
// - Shift + / or ? -> Open keyboard shortcuts modal
// - Esc -> Close active modal / search
// - / -> Focus search input
// - Ctrl + K / Cmd + K -> Open command palette
// - g + h/d/r/p/c/u -> Quick navigation (Home, Dashboard, Repositories, Profile, Contributors, Customization)

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
      if (isTypingTarget(event.target)) {
        if (event.key === 'Escape') {
          options?.onCloseActiveModal?.();
        }
        return;
      }

      // Esc closes active modal/dialog/search
      if (event.key === 'Escape') {
        options?.onCloseActiveModal?.();
        return;
      }

      // Ctrl + K / Cmd + K opens quick navigation / command palette
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        options?.onToggleCommandPalette?.();
        return;
      }

      // ? or Shift + / opens shortcuts modal
      if (
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        (event.key === '?' || (event.key === '/' && event.shiftKey))
      ) {
        event.preventDefault();
        options?.onOpenShortcuts?.();
        return;
      }

      // / focuses search input (when not already typing)
      if (
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        !event.shiftKey &&
        event.key === '/'
      ) {
        event.preventDefault();
        options?.onFocusSearch?.();
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
        if (route.startsWith('http://') || route.startsWith('https://')) {
          window.open(route, '_blank', 'noopener,noreferrer');
        } else {
          router.push(route);
        }
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
