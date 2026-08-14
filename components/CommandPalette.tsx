'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import * as LucideIcons from 'lucide-react';

export interface CommandItem {
  id: string;
  title: string;
  category: 'Navigation' | 'Actions' | 'External';
  iconName: string;
  action: () => void;
  keywords?: string[];
  shortcut?: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenShortcuts?: () => void;
}

function getLucideIcon(name: string): React.ElementType | null {
  try {
    const icons = LucideIcons as Record<string, unknown>;
    const Icon = icons[name];
    if (typeof Icon === 'function' || (typeof Icon === 'object' && Icon !== null)) {
      return Icon as React.ElementType;
    }
  } catch (_) {
    return null;
  }
  return null;
}

function DynamicIcon({
  name,
  size,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const IconComponent = getLucideIcon(name);
  if (!IconComponent) {
    return null;
  }
  return React.createElement(IconComponent, { size, className });
}

function useSafeRouter() {
  try {
    return useRouter();
  } catch (_) {
    return {
      push: (href: string) => {
        if (typeof window !== 'undefined') {
          window.location.href = href;
        }
      },
    };
  }
}

export default function CommandPalette({ isOpen, onClose, onOpenShortcuts }: CommandPaletteProps) {
  const router = useSafeRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const handleClose = useCallback(() => {
    setQuery('');
    setSelectedIndex(0);
    onClose();
  }, [onClose]);

  const commandItems: CommandItem[] = useMemo(
    () => [
      {
        id: 'nav-home',
        title: 'Go to Home',
        category: 'Navigation',
        iconName: 'Compass',
        action: () => {
          router.push('/');
          handleClose();
        },
        keywords: ['home', 'landing', 'main', 'index'],
        shortcut: ['G', 'H'],
      },
      {
        id: 'nav-generator',
        title: 'Go to SVG Generator',
        category: 'Navigation',
        iconName: 'Sparkles',
        action: () => {
          router.push('/generator');
          handleClose();
        },
        keywords: ['generator', 'svg', 'create', 'build'],
      },
      {
        id: 'nav-compare',
        title: 'Go to Developer Compare',
        category: 'Navigation',
        iconName: 'GitCompare',
        action: () => {
          router.push('/compare');
          handleClose();
        },
        keywords: ['compare', 'vs', 'rivalry', 'battle'],
        shortcut: ['G', 'P'],
      },
      {
        id: 'nav-burnout',
        title: 'Go to Burnout Radar',
        category: 'Navigation',
        iconName: 'Flame',
        action: () => {
          router.push('/burnout-analyzer');
          handleClose();
        },
        keywords: ['burnout', 'radar', 'health', 'analyzer', 'stats'],
        shortcut: ['G', 'D'],
      },
      {
        id: 'nav-contributors',
        title: 'Go to Contributors',
        category: 'Navigation',
        iconName: 'Users',
        action: () => {
          router.push('/contributors');
          handleClose();
        },
        keywords: ['contributors', 'community', 'team', 'authors'],
        shortcut: ['G', 'C'],
      },
      {
        id: 'nav-studio',
        title: 'Go to Customization Studio',
        category: 'Navigation',
        iconName: 'Sliders',
        action: () => {
          router.push('/customize');
          handleClose();
        },
        keywords: ['customization', 'studio', 'themes', 'style'],
        shortcut: ['G', 'U'],
      },
      {
        id: 'action-shortcuts',
        title: 'Open Keyboard Shortcuts',
        category: 'Actions',
        iconName: 'Keyboard',
        action: () => {
          handleClose();
          onOpenShortcuts?.();
        },
        keywords: ['keyboard', 'shortcuts', 'help', 'hotkeys'],
        shortcut: ['?'],
      },
      {
        id: 'action-scroll-top',
        title: 'Scroll to Top of Page',
        category: 'Actions',
        iconName: 'ArrowUp',
        action: () => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          handleClose();
        },
        keywords: ['scroll', 'top', 'up'],
      },
      {
        id: 'external-github',
        title: 'Open GitHub Repository',
        category: 'External',
        iconName: 'Github',
        action: () => {
          window.open(
            'https://github.com/JhaSourav07/commitpulse',
            '_blank',
            'noopener,noreferrer'
          );
          handleClose();
        },
        keywords: ['github', 'repo', 'source', 'code', 'git'],
        shortcut: ['G', 'R'],
      },
    ],
    [router, handleClose, onOpenShortcuts]
  );

  const filteredItems = useMemo(() => {
    if (!query.trim()) return commandItems;
    const q = query.toLowerCase().trim();
    return commandItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.keywords?.some((k) => k.toLowerCase().includes(q))
    );
  }, [query, commandItems]);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setSelectedIndex(0);
  };

  useEffect(() => {
    if (isOpen) {
      if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
        previousFocusRef.current = document.activeElement;
      }
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = '';
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          filteredItems.length > 0 ? (prev + 1) % filteredItems.length : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          filteredItems.length > 0 ? (prev - 1 + filteredItems.length) % filteredItems.length : 0
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].action();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, handleClose]);

  useEffect(() => {
    if (!isOpen) return;
    const activeEl = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    activeEl?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex, isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-start justify-center pt-16 sm:pt-24 px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Container */}
      <div className="relative w-full max-w-xl rounded-2xl border border-black/10 dark:border-white/15 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl shadow-2xl overflow-hidden focus:outline-none animate-in fade-in zoom-in-95 duration-150">
        {/* Search Header */}
        <div className="relative flex items-center px-4 py-3 border-b border-black/10 dark:border-white/10">
          <DynamicIcon
            name="Search"
            size={18}
            className="text-gray-400 dark:text-gray-500 mr-3 flex-shrink-0"
          />
          <input
            ref={inputRef}
            type="text"
            role="searchbox"
            aria-label="Search commands"
            placeholder="Type a command or search..."
            value={query}
            onChange={handleQueryChange}
            className="w-full bg-transparent text-sm sm:text-base font-medium text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close command palette"
            className="ml-2 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          >
            <DynamicIcon name="X" size={16} />
          </button>
        </div>

        {/* Results List */}
        <div ref={listRef} className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              No matching commands found.
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  data-index={index}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all ${
                    isSelected
                      ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 font-semibold'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-1.5 rounded-lg ${
                        isSelected
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      <DynamicIcon name={item.iconName} size={16} />
                    </div>
                    <span className="text-sm truncate">{item.title}</span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {item.category === 'External' && (
                      <DynamicIcon name="ExternalLink" size={14} className="text-gray-400" />
                    )}
                    {item.shortcut && (
                      <div className="flex items-center gap-1">
                        {item.shortcut.map((key) => (
                          <kbd
                            key={key}
                            className="px-1.5 py-0.5 text-[10px] font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded"
                          >
                            {key}
                          </kbd>
                        ))}
                      </div>
                    )}
                    {isSelected && (
                      <DynamicIcon name="CornerDownLeft" size={14} className="text-emerald-500" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-black/10 dark:border-white/10 bg-gray-50/50 dark:bg-zinc-900/50 text-[11px] text-gray-400 dark:text-gray-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-zinc-800 rounded">↑</kbd>
              <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-zinc-800 rounded">↓</kbd>
              <span>Navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-zinc-800 rounded">↵</kbd>
              <span>Select</span>
            </span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-zinc-800 rounded">Esc</kbd>
            <span>Close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
