'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ShortcutContextType {
  isHelpOpen: boolean;
  isCommandPaletteOpen: boolean;
  openHelp: () => void;
  closeHelp: () => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  closeAll: () => void;
}

const ShortcutContext = createContext<ShortcutContextType | undefined>(undefined);

export const ShortcutProvider = ({ children }: { children: ReactNode }) => {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  const openHelp = () => {
    setIsCommandPaletteOpen(false); // Ensure only one modal opens at a time
    setIsHelpOpen(true);
  };

  const closeHelp = () => setIsHelpOpen(false);

  const openCommandPalette = () => {
    setIsHelpOpen(false);
    setIsCommandPaletteOpen(true);
  };

  const closeCommandPalette = () => setIsCommandPaletteOpen(false);

  const closeAll = () => {
    setIsHelpOpen(false);
    setIsCommandPaletteOpen(false);
  };

  return (
    <ShortcutContext.Provider
      value={{
        isHelpOpen,
        isCommandPaletteOpen,
        openHelp,
        closeHelp,
        openCommandPalette,
        closeCommandPalette,
        closeAll,
      }}
    >
      {children}
    </ShortcutContext.Provider>
  );
};

export const useShortcutContext = () => {
  const context = useContext(ShortcutContext);
  if (context === undefined) {
    throw new Error('useShortcutContext must be used within a ShortcutProvider');
  }
  return context;
};
