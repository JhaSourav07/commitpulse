'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // ACCESSIBILITY: Focus management & Escape key handling
  useEffect(() => {
    if (!isOpen) return;

    // 1. Auto-focus the modal container for screen readers and keyboard navigation
    // The timeout ensures the DOM is painted before trying to grab focus
    const focusTimer = setTimeout(() => {
      dialogRef.current?.focus();
    }, 50);

    // 2. Allow closing via Escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation(); // Prevent global escape from firing simultaneously
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      {/* role="dialog" and aria-modal="true" explicitly tell screen readers 
        that this is an interrupting popup window 
      */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="w-full max-w-lg bg-zinc-950 border border-white/10 rounded-2xl shadow-[0_14px_40px_rgba(0,0,0,0.45)] overflow-hidden outline-none focus:outline-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 id="modal-title" className="text-lg font-semibold text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/30 rounded-lg p-1.5 hover:bg-white/5"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="px-6 py-5 text-white/90">{children}</div>
      </div>
    </div>
  );
}
