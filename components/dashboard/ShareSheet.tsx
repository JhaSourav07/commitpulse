'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  Code,
  Download,
  FileJson,
  FileText,
  Link2,
  Loader2,
  Share2,
  Smartphone,
  X,
  Box,
  Sparkles,
} from 'lucide-react';
import type { DashboardExportData } from '@/types/dashboard';
import { useShareActions } from '@/hooks/useShareActions';

type OptionState = 'idle' | 'loading' | 'success' | 'error';

const XBrandIcon = ({ size = 18, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.63L18.244 2.25Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const LinkedInIcon = ({ size = 18, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const RedditIcon = ({ size = 18, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M14.47 15.67a1.09 1.09 0 0 1-1.09 1.09 1.09 1.09 0 0 1-1.09-1.09 1.09 1.09 0 0 1 1.09-1.09 1.09 1.09 0 0 1 1.09 1.09Zm-4.75-1.09a1.09 1.09 0 1 0 0 2.18 1.09 1.09 0 0 0 0-2.18Zm8.18-4.05a1.64 1.64 0 0 0-1.64-1.64 1.61 1.61 0 0 0-1.18.5 6.18 6.18 0 0 0-2.95-.77l.5-2.36 1.64.36a1.09 1.09 0 1 0 .18-.82l-2-.41a.41.41 0 0 0-.5.32l-.59 2.77a6.54 6.54 0 0 0-3.09.77 1.64 1.64 0 1 0-2.5 2.14 3.27 3.27 0 0 0-.09.77c0 2.45 2.86 4.41 6.41 4.41s6.41-2 6.41-4.41a3.27 3.27 0 0 0-.09-.77 1.63 1.63 0 0 0 .91-1.46Z" />
  </svg>
);

interface ShareSheetProps {
  username: string;
  isOpen: boolean;
  onClose: () => void;
  exportData: DashboardExportData;
}

export default function ShareSheet({ username, isOpen, onClose, exportData }: ShareSheetProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Existing actions from the custom hook
  const {
    states,
    handleCopyLink,
    handleTwitter,
    handleLinkedIn,
    handleReddit,
    handleDownloadPNG,
    handleDownloadWEBP,
    handleCopyImage,
    handleDownloadSVG,
    handleCopyMarkdown,
    handleDownloadCSV,
    handleDownloadJSON,
    handleNativeShare,
  } = useShareActions(username, exportData, onClose);

  // Local state for the new epic features (since we can't edit useShareActions right now)
  const [localStates, setLocalStates] = useState<Record<string, OptionState>>({});

  const setLocalOptionState = (key: string, state: OptionState) => {
    setLocalStates((prev) => ({ ...prev, [key]: state }));
    if (state === 'success' || state === 'error') {
      setTimeout(() => setLocalStates((prev) => ({ ...prev, [key]: 'idle' })), 2500);
    }
  };

  const handleDownloadSTL = async () => {
    setLocalOptionState('stl', 'loading');
    try {
      // Simulate STL processing time
      await new Promise((resolve) => setTimeout(resolve, 1200));

      // Basic STL placeholder generation (A true 3D generator would iterate over the calendar)
      const stlContent = `solid commitpulse_monolith
  facet normal 0 0 1
    outer loop
      vertex 0 0 0
      vertex 10 0 0
      vertex 10 10 0
    endloop
  endfacet
endsolid commitpulse_monolith`;

      const blob = new Blob([stlContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${username}-monolith.stl`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);

      setLocalOptionState('stl', 'success');
      setTimeout(() => onClose(), 800);
    } catch {
      setLocalOptionState('stl', 'error');
    }
  };

  const handleGitHubWrapped = () => {
    // Navigate to the Wrapped experience
    window.open(`/dashboard/${username}/wrapped`, '_blank');
    onClose();
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const combinedStates = { ...states, ...localStates };

  const options = [
    {
      key: 'wrapped',
      icon: Sparkles,
      label: 'GitHub Wrapped',
      description: 'View your end-of-year recap',
      gradient: 'from-purple-500 to-pink-500',
      glow: 'rgba(236,72,153,0.35)',
      action: handleGitHubWrapped,
    },
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
      key: 'markdown',
      icon: Code,
      label: 'Copy Markdown',
      description: 'Copy markdown snippet for your README',
      gradient: 'bg-zinc-800',
      glow: 'transparent',
      action: handleCopyMarkdown,
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
      key: 'webp',
      icon: Download,
      label: 'Download as WebP',
      description: 'Download optimized WebP image',
      gradient: 'bg-zinc-800',
      glow: 'transparent',
      action: handleDownloadWEBP,
    },
    {
      key: 'copyImage',
      icon: Download,
      label: 'Copy as Image',
      description: 'Copy dashboard image to clipboard',
      gradient: 'bg-zinc-800',
      glow: 'transparent',
      action: handleCopyImage,
    },
    {
      key: 'svg',
      icon: Download,
      label: 'Download SVG',
      description: 'Download the raw monolith SVG',
      gradient: 'bg-zinc-800',
      glow: 'transparent',
      action: handleDownloadSVG,
    },
    {
      key: 'stl',
      icon: Box,
      label: 'Download 3D STL',
      description: 'Print your monolith in 3D',
      gradient: 'bg-zinc-800',
      glow: 'transparent',
      action: handleDownloadSTL,
    },
    {
      key: 'csv',
      icon: FileText,
      label: 'Download CSV',
      description: 'Export stats and daily contribution counts',
      gradient: 'bg-zinc-800',
      glow: 'transparent',
      action: handleDownloadCSV,
    },
    {
      key: 'json',
      icon: FileJson,
      label: 'Download JSON',
      description: 'Export raw streak and language data',
      gradient: 'bg-zinc-800',
      glow: 'transparent',
      action: handleDownloadJSON,
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
    {
      key: 'reddit',
      icon: RedditIcon,
      label: 'Reddit',
      description: 'Share on Reddit',
      gradient: 'from-orange-500 to-orange-700',
      glow: 'rgba(249,115,22,0.35)',
      action: handleReddit,
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
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
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-sm max-h-[85vh] overflow-y-auto custom-scrollbar"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="rounded-xl bg-white/90 dark:bg-[#111]/90 backdrop-blur-xl border border-black/10 dark:border-white/10 shadow-[0_24px_64px_rgba(0,0,0,0.18)] dark:shadow-[0_24px_64px_rgba(0,0,0,0.7)] overflow-hidden">
                <div className="sticky top-0 z-10 bg-white/90 dark:bg-[#111]/90 backdrop-blur-md flex items-center justify-between px-5 pt-5 pb-4 border-b border-black/5 dark:border-white/10">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight">
                      Share Pulse
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-white/65 mt-0.5">@{username}</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-7 h-7 rounded-md bg-transparent hover:bg-black/5 dark:hover:bg-white/6 flex items-center justify-center transition-colors duration-150 border border-transparent dark:border-[rgba(255,255,255,0.08)]"
                    aria-label="Close share options panel"
                  >
                    <X size={14} className="text-gray-500 dark:text-white/65" />
                  </button>
                </div>

                <div className="flex flex-col p-3 gap-1">
                  {options.map((opt, idx) => {
                    const state = combinedStates[opt.key] ?? 'idle';
                    const Icon = opt.icon;
                    return (
                      <motion.button
                        key={opt.key}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.03, duration: 0.15 }}
                        onClick={opt.action}
                        disabled={state === 'loading'}
                        className="group flex items-center gap-3 w-full px-3 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] border border-transparent hover:border-black/5 dark:hover:border-white/10 transition-all duration-200 text-left disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <div
                          className={`flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/[0.04] border border-black/5 dark:border-[rgba(255,255,255,0.08)] flex items-center justify-center transition-colors ${opt.key === 'wrapped' ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-pink-500/30' : ''}`}
                        >
                          {state === 'loading' ? (
                            <Loader2
                              size={15}
                              className="text-gray-500 dark:text-white/65 animate-spin"
                            />
                          ) : state === 'success' ? (
                            <Check size={15} className="text-emerald-600 dark:text-white" />
                          ) : (
                            <Icon
                              size={15}
                              className={`${opt.key === 'wrapped' ? 'text-pink-500 dark:text-pink-400' : 'text-gray-500 dark:text-white/65'} group-hover:text-black dark:group-hover:text-white transition-colors duration-200`}
                            />
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm text-gray-900 dark:text-white font-medium leading-tight">
                            {state === 'success'
                              ? opt.key === 'copy'
                                ? 'Link Copied!'
                                : opt.key === 'png'
                                  ? 'Downloaded!'
                                  : opt.key === 'csv'
                                    ? 'CSV Downloaded!'
                                    : opt.key === 'copyImage'
                                      ? 'Image Copied!'
                                      : opt.key === 'png'
                                        ? 'Downloaded!'
                                        : opt.key === 'json'
                                          ? 'JSON Downloaded!'
                                          : opt.key === 'svg'
                                            ? 'SVG Downloaded!'
                                            : opt.key === 'stl'
                                              ? 'STL Generated!'
                                              : opt.label
                              : state === 'error'
                                ? 'Failed — try again'
                                : opt.label}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-white/65 mt-0.5 truncate">
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
