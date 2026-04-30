'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Link2,
  Download,
  Share2,
  Check,
  Loader2,
  Smartphone,
} from 'lucide-react';

// Inline branded icons (Twitter/X brand, LinkedIn brand)
const XBrandIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.63L18.244 2.25Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const LinkedInIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);


interface ShareSheetProps {
  username: string;
  isOpen: boolean;
  onClose: () => void;
}

type OptionState = 'idle' | 'loading' | 'success' | 'error';

const PROFILE_URL = (username: string) =>
  typeof window !== 'undefined'
    ? `${window.location.origin}/${username}`
    : `https://commitpulse.vercel.app/${username}`;

export default function ShareSheet({ username, isOpen, onClose }: ShareSheetProps) {
  const [states, setStates] = useState<Record<string, OptionState>>({});
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Prevent scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const setOptionState = (key: string, state: OptionState) => {
    setStates(prev => ({ ...prev, [key]: state }));
    if (state === 'success' || state === 'error') {
      setTimeout(() => setStates(prev => ({ ...prev, [key]: 'idle' })), 2500);
    }
  };

  /* ── Option handlers ─────────────────────────── */

  const handleCopyLink = async () => {
    setOptionState('copy', 'loading');
    try {
      await navigator.clipboard.writeText(PROFILE_URL(username));
      setOptionState('copy', 'success');
      setTimeout(() => onClose(), 800);
    } catch {
      setOptionState('copy', 'error');
    }
  };

  const handleTwitter = () => {
    const url = PROFILE_URL(username);
    const text = encodeURIComponent(
      `Check out my GitHub commit pulse on CommitPulse 🚀\n${url}`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank', 'noopener');
    onClose();
  };

  const handleLinkedIn = () => {
    const url = encodeURIComponent(PROFILE_URL(username));
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      '_blank',
      'noopener'
    );
    onClose();
  };

  const handleDownloadPNG = async () => {
    setOptionState('png', 'loading');
    try {
      // Dynamically import html-to-image to keep bundle size down
      const { toPng } = await import('html-to-image');

      // Target the whole dashboard wrapper; fall back to body
      const node =
        document.getElementById('dashboard-root') ??
        document.querySelector<HTMLElement>('[data-dashboard]') ??
        document.body;

      const dataUrl = await toPng(node, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: '#050505',
        filter: (el) => {
          // Exclude the share sheet itself from the capture
          if (el instanceof HTMLElement && el.id === 'share-sheet-overlay') return false;
          return true;
        },
      });

      const link = document.createElement('a');
      link.download = `${username}-commitpulse.png`;
      link.href = dataUrl;
      link.click();
      setOptionState('png', 'success');
    } catch {
      setOptionState('png', 'error');
    }
  };

  const handleNativeShare = async () => {
    if (!('share' in navigator)) {
      // Graceful fallback: just copy the link
      await handleCopyLink();
      return;
    }
    setOptionState('native', 'loading');
    try {
      await navigator.share({
        title: `${username}'s Commit Pulse`,
        text: `Check out my GitHub contribution pulse — streaks, insights, and more.`,
        url: PROFILE_URL(username),
      });
      setOptionState('native', 'success');
      setTimeout(() => onClose(), 600);
    } catch (err) {
      // User cancelled — not an error worth showing
      if (err instanceof Error && err.name !== 'AbortError') {
        setOptionState('native', 'error');
      } else {
        setOptionState('native', 'idle');
      }
    }
  };

  /* ── Option config ───────────────────────────── */

  const options = [
    {
      key: 'copy',
      icon: Link2,
      label: 'Copy Link',
      description: 'Copy your profile URL to clipboard',
      gradient: 'bg-zinc-800',
      glow: 'transparent',
      action: handleCopyLink,
    },
    {
      key: 'twitter',
      icon: XBrandIcon,
      label: 'Share on X',
      description: 'Tweet your pulse to the world',
      gradient: 'from-slate-600 to-slate-800',
      glow: 'rgba(100,116,139,0.35)',
      action: handleTwitter,
    },
    {
      key: 'linkedin',
      icon: LinkedInIcon,
      label: 'Share on LinkedIn',
      description: 'Post your dev activity to your network',
      gradient: 'from-blue-600 to-blue-800',
      glow: 'rgba(37,99,235,0.35)',
      action: handleLinkedIn,
    },
    {
      key: 'png',
      icon: Download,
      label: 'Download as PNG',
      description: 'Save a snapshot of your dashboard',
      gradient: 'bg-zinc-800',
      glow: 'transparent',
      action: handleDownloadPNG,
    },
    {
      key: 'native',
      icon: typeof window !== 'undefined' && 'share' in navigator ? Smartphone : Share2,
      label:
        typeof window !== 'undefined' && 'share' in navigator
          ? 'Share via OS Sheet'
          : 'More Options',
      description:
        typeof window !== 'undefined' && 'share' in navigator
          ? 'AirDrop, WhatsApp, Messages & more'
          : 'Open the system share dialog',
      gradient: 'bg-zinc-800',
      glow: 'transparent',
      action: handleNativeShare,
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            id="share-sheet-overlay"
            ref={overlayRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-4"
          >
          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="rounded-xl bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] shadow-[0_24px_64px_rgba(0,0,0,0.9)] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[rgba(255,255,255,0.06)]">
                <div>
                  <h2 className="text-sm font-semibold text-white tracking-tight">Share Pulse</h2>
                  <p className="text-xs text-[#A1A1AA] mt-0.5">@{username}</p>
                </div>
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-md bg-transparent hover:bg-white/6 flex items-center justify-center transition-colors duration-150 border border-[rgba(255,255,255,0.08)]"
                  aria-label="Close"
                >
                  <X size={14} className="text-[#A1A1AA]" />
                </button>
              </div>

              {/* Options */}
              <div className="flex flex-col p-3 gap-1">
                {options.map((opt, idx) => {
                  const state = states[opt.key] ?? 'idle';
                  const Icon = opt.icon;

                  return (
                    <motion.button
                      key={opt.key}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.04, duration: 0.15 }}
                      onClick={opt.action}
                      disabled={state === 'loading'}
                      className="group flex items-center gap-3 w-full px-3 py-3 rounded-lg hover:bg-[rgba(255,255,255,0.05)] border border-transparent hover:border-[rgba(255,255,255,0.08)] transition-all duration-200 text-left disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {/* Icon box */}
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-zinc-900 border border-[rgba(255,255,255,0.08)] flex items-center justify-center">
                        {state === 'loading' ? (
                          <Loader2 size={15} className="text-[#A1A1AA] animate-spin" />
                        ) : state === 'success' ? (
                          <Check size={15} className="text-white" />
                        ) : (
                          <Icon size={15} className="text-[#A1A1AA] group-hover:text-white transition-colors duration-200" />
                        )}
                      </div>

                      {/* Label */}
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm text-white font-medium leading-tight">
                          {state === 'success'
                            ? opt.key === 'copy'
                              ? 'Link Copied!'
                              : opt.key === 'png'
                                ? 'Downloaded!'
                                : opt.label
                            : state === 'error'
                              ? 'Failed — try again'
                              : opt.label}
                        </span>
                        <span className="text-xs text-[#A1A1AA] mt-0.5 truncate">
                          {opt.description}
                        </span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
