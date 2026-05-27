'use client';

import { useShortcutContext } from '@/context/ShortcutContext';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

type Command = {
  id: string;
  name: string;
  description: string;
  action: () => void;
};

export const CommandPalette = () => {
  const { isCommandPaletteOpen, closeCommandPalette } = useShortcutContext();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: Command[] = [
    {
      id: 'home',
      name: 'Go to Home',
      description: 'Navigate to the landing page',
      action: () => router.push('/'),
    },
    {
      id: 'dash',
      name: 'Go to Dashboard',
      description: 'View your contribution stats',
      action: () => router.push('/dashboard'),
    },
    {
      id: 'repo',
      name: 'Go to Repositories',
      description: 'Manage your GitHub repositories',
      action: () => router.push('/repositories'),
    },
    {
      id: 'prof',
      name: 'Go to Profile',
      description: 'Update your user settings',
      action: () => router.push('/profile'),
    },
  ];

  const filteredCommands = commands.filter(
    (cmd) =>
      cmd.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cmd.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Reset state and focus input when opened
  useEffect(() => {
    if (isCommandPaletteOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchQuery('');

      setSelectedIndex(0);

      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isCommandPaletteOpen]);

  // Handle internal keyboard navigation (Up, Down, Enter)
  useEffect(() => {
    if (!isCommandPaletteOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
        e.preventDefault();
        filteredCommands[selectedIndex].action();
        closeCommandPalette();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, filteredCommands, selectedIndex, closeCommandPalette]);

  if (!isCommandPaletteOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="palette-title"
        className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden"
      >
        <span id="palette-title" className="sr-only">
          Command Palette
        </span>

        <div className="flex items-center border-b border-zinc-800 px-4">
          <svg
            className="w-5 h-5 text-zinc-400 mr-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-transparent py-4 text-white placeholder-zinc-500 focus:outline-none"
            placeholder="Type a command or search..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
          <kbd className="hidden sm:inline-block px-2 py-1 text-xs font-medium text-zinc-500 bg-zinc-900 border border-zinc-800 rounded">
            ESC
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="p-4 text-center text-zinc-500 text-sm">No results found.</div>
          ) : (
            <ul role="listbox">
              {filteredCommands.map((cmd, index) => (
                <li
                  key={cmd.id}
                  role="option"
                  aria-selected={index === selectedIndex}
                  onClick={() => {
                    cmd.action();
                    closeCommandPalette();
                  }}
                  className={`flex flex-col px-4 py-3 rounded-lg cursor-pointer transition-colors ${
                    index === selectedIndex
                      ? 'bg-zinc-800/50 text-white'
                      : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-300'
                  }`}
                >
                  <span className="text-sm font-medium">{cmd.name}</span>
                  <span className="text-xs text-zinc-500">{cmd.description}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
