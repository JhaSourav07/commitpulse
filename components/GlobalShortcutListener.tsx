'use client';

import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useShortcutContext } from '../context/ShortcutContext';

export const GlobalShortcutListener = () => {
  const { openHelp, closeAll, openCommandPalette } = useShortcutContext();

  useKeyboardShortcuts({
    onOpenHelp: openHelp,
    onCloseModal: closeAll,
    onOpenCommandPalette: openCommandPalette,
    onFocusSearch: () => {
      // Dispatch a custom event so the Search component can catch it anywhere in the app
      document.dispatchEvent(new CustomEvent('focusSearch'));
    },
  });

  return null; // This component is purely logical and renders nothing
};
