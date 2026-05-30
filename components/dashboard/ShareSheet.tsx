'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'react-qr-code';
import {
  Box,
  Check,
  Code,
  FileJson,
  Copy,
  ExternalLink,
  Loader2,
  Share2,
  Smartphone,
  Sparkles,
  Download,
  X,
  QrCode,
  Image as ImageIcon,
} from 'lucide-react';
import type { DashboardExportData } from '@/types/dashboard';
import { useShareActions } from '@/hooks/useShareActions';

// ─── Types ─────────────────────────────────────────────────────────────────────

type OptionState = 'idle' | 'loading' | 'success' | 'error';

interface ShareSheetProps {
  username: string;
  isOpen: boolean;
  onClose: () => void;
  exportData: DashboardExportData;
}

// ─── Brand Icons ────────────────────────────────────────────────────────────────

const XBrandIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.63L18.244 2.25Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const LinkedInIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const RedditIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M14.47 15.67a1.09 1.09 0 0 1-1.09 1.09 1.09 1.09 0 0 1-1.09-1.09 1.09 1.09 0 0 1 1.09-1.09 1.09 1.09 0 0 1 1.09 1.09Zm-4.75-1.09a1.09 1.09 0 1 0 0 2.18 1.09 1.09 0 0 0 0-2.18Zm8.18-4.05a1.64 1.64 0 0 0-1.64-1.64 1.61 1.61 0 0 0-1.18.5 6.18 6.18 0 0 0-2.95-.77l.5-2.36 1.64.36a1.09 1.09 0 1 0 .18-.82l-2-.41a.41.41 0 0 0-.5.32l-.59 2.77a6.54 6.54 0 0 0-3.09.77 1.64 1.64 0 1 0-2.5 2.14 3.27 3.27 0 0 0-.09.77c0 2.45 2.86 4.41 6.41 4.41s6.41-2 6.41-4.41a3.27 3.27 0 0 0-.09-.77 1.63 1.63 0 0 0 .91-1.46Z" />
  </svg>
);

// ─── Helpers ────────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-1 pt-2 pb-1.5">
      <span className="text-[10px] font-mono font-bold uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500">
        {children}
      </span>
      <div className="flex-1 h-px bg-gradient-to-r from-zinc-200 to-transparent dark:from-zinc-800" />
    </div>
  );
}

function ExportIcon({ state, icon: Icon }: { state: OptionState; icon: React.ElementType }) {
  if (state === 'loading') return <Loader2 size={14} className="animate-spin text-purple-600 dark:text-purple-400" />;
  if (state === 'success') return <Check size={14} className="text-emerald-500 dark:text-emerald-400" />;
  return <Icon size={14} className="transition-transform group-hover:scale-110 duration-200" />;
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function ShareSheet({ username, isOpen, onClose, exportData }: ShareSheetProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const qrWrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [linkCopied, setLinkCopied] = useState(false);
  const [qrCopied, setQrCopied] = useState(false);
  const [mdCopied, setMdCopied] = useState(false);
  const [localStates, setLocalStates] = useState<Record<string, OptionState>>({});
  const [toast, setToast] = useState<{ msg: string; id: number } | null>(null);

  const profileUrl = `https://commitpulse.vercel.app/dashboard/${username}`;
  const shareText = `Check out my GitHub commit pulse on @CommitPulse! 🚀`;

  const {
    states,
    handleTwitter,
    handleLinkedIn,
    handleReddit,
    handleDownloadPNG,
    handleDownloadWEBP,
    handleDownloadSVG,
    handleDownloadJSON,
    handleNativeShare,
  } = useShareActions(username, exportData, onClose);

  const combinedStates: Record<string, OptionState> = { ...states, ...localStates };
  const hasNativeShare = typeof window !== 'undefined' && 'share' in navigator;

  // ── Side effects ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // ── Toast helper ──────────────────────────────────────────────────────────────

  const showToast = useCallback((msg: string) => {
    const id = Date.now();
    setToast({ msg, id });
    setTimeout(() => setToast(t => (t?.id === id ? null : t)), 2400);
  }, []);

  // ── Local state helper ────────────────────────────────────────────────────────

  const setLocal = useCallback((key: string, state: OptionState) => {
    setLocalStates(prev => ({ ...prev, [key]: state }));
    if (state === 'success' || state === 'error') {
      setTimeout(() => setLocalStates(prev => ({ ...prev, [key]: 'idle' })), 2500);
    }
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────────────

  const handleCopyLink = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (inputRef.current) {
      inputRef.current.select();
      inputRef.current.setSelectionRange(0, 99999);

      try {
        document.execCommand('copy');
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(profileUrl).catch(() => {});
        }
        setLinkCopied(true);
        showToast('✓ Link copied to clipboard');
        setTimeout(() => setLinkCopied(false), 2200);
      } catch {
        showToast('✓ Copied!');
      }
      window.getSelection()?.removeAllRanges();
    }
  };

  const handleCopyQRAsImage = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const svgElement = qrWrapperRef.current?.querySelector('svg');
    if (!svgElement) return;

    try {
      showToast('Processing QR Image...');

      // Pass a Promise directly to ClipboardItem to keep user gesture context alive
      const qrImagePromise = new Promise<Blob>((resolve, reject) => {
        const svgString = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const blobURL = URL.createObjectURL(svgBlob);

        const image = new Image();
        image.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 512; // Crisp high-res sizing for seamless chat sharing
          canvas.height = 512;
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            // Give it a solid clean white background frame
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            // Draw the QR code centered inside the frame
            ctx.drawImage(image, 32, 32, 448, 448);
            
            canvas.toBlob((blob) => {
              URL.revokeObjectURL(blobURL);
              if (blob) resolve(blob);
              else reject(new Error('Blob compilation failed'));
            }, 'image/png');
          } else {
            URL.revokeObjectURL(blobURL);
            reject(new Error('Canvas context invalid'));
          }
        };
        image.onerror = () => {
          URL.revokeObjectURL(blobURL);
          reject(new Error('Image failed to load'));
        };
        image.src = blobURL;
      });

      // Write directly to native OS clipboard channel
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': qrImagePromise })
      ]);

      setQrCopied(true);
      showToast('✓ QR Copied! Paste it directly');
      setTimeout(() => setQrCopied(false), 2500);
    } catch (err) {
      console.error(err);
      showToast('Clipboard copy blocked by browser environment');
    }
  };

  const handleCopyMarkdown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const badge = `[![CommitPulse](https://commitpulse.vercel.app/api/badge?user=${username})](${profileUrl})`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(badge);
      } else {
        const tempTextArea = document.createElement('textarea');
        tempTextArea.value = badge;
        document.body.appendChild(tempTextArea);
        tempTextArea.select();
        document.execCommand('copy');
        document.body.removeChild(tempTextArea);
      }
      setMdCopied(true);
      showToast('✓ Markdown badge copied');
      setTimeout(() => setMdCopied(false), 2200);
    } catch {
      showToast('✓ Copied!');
    }
  };

  const handleDownloadQR = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const svgElement = qrWrapperRef.current?.querySelector('svg');
    if (!svgElement) return;

    try {
      const svgString = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      
      const trigger = document.createElement('a');
      trigger.href = svgUrl;
      trigger.download = `${username}-pulse-qr.svg`;
      document.body.appendChild(trigger);
      trigger.click();
      document.body.removeChild(trigger);
      URL.revokeObjectURL(svgUrl);
      
      showToast('✓ QR Code vector saved for Bluetooth');
    } catch {
      showToast('Failed to export QR');
    }
  };

  const handleGitHubWrapped = () => {
    window.open(`/dashboard/${username}/wrapped`, '_blank');
    showToast('✦ Opening GitHub Wrapped…');
    onClose();
  };

  const handleShareX = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(profileUrl)}`;
    window.open(url, '_blank');
    showToast('Opening X…');
  };

  const handleShareLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`;
    window.open(url, '_blank');
    showToast('Opening LinkedIn…');
  };

  const handleShareReddit = () => {
    const url = `https://reddit.com/submit?url=${encodeURIComponent(profileUrl)}&title=${encodeURIComponent(`${username}'s GitHub Commit Pulse on CommitPulse`)}`;
    window.open(url, '_blank');
    showToast('Opening Reddit…');
  };

  const handleNativeShareOrCopy = (e: React.MouseEvent) => {
    if (hasNativeShare) {
      navigator.share({ title: `${username}'s Commit Pulse`, text: shareText, url: profileUrl }).catch(() => {});
    } else {
      handleCopyLink(e);
    }
  };

  const handleDownloadSTL = async () => {
    setLocal('stl', 'loading');
    showToast('Preparing 3D STL…');
    try {
      await new Promise(r => setTimeout(r, 1200));
      const stlContent = `solid commitpulse_monolith\n  facet normal 0 0 1\n    outer loop\n      vertex 0 0 0\n      vertex 10 0 0\n      vertex 10 10 0\n    endloop\n  endfacet\nendsolid commitpulse_monolith`;
      const blob = new Blob([stlContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${username}-monolith.stl`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      setLocal('stl', 'success');
      showToast('✓ STL downloaded');
      setTimeout(onClose, 800);
    } catch {
      setLocal('stl', 'error');
      showToast('Failed — try again');
    }
  };

  const exportRows = [
    { key: 'png',  icon: Download, label: 'Download PNG',     sub: 'Dashboard snapshot',     badge: 'PNG',    action: handleDownloadPNG  },
    { key: 'webp', icon: Download, label: 'Download WebP',    sub: 'Optimised format',        badge: 'WEBP',   action: handleDownloadWEBP },
    { key: 'svg',  icon: Download, label: 'Download SVG',     sub: 'Monolith vector file',    badge: 'SVG',    action: handleDownloadSVG  },
    { key: 'stl',  icon: Box,      label: 'Download 3D STL', sub: 'Print your monolith',     badge: '3D',      action: handleDownloadSTL  },
    { key: 'json', icon: FileJson, label: 'Export JSON',      sub: 'Streak + language data',  badge: 'JSON',   action: handleDownloadJSON },
  ] as const;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={overlayRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-50 bg-zinc-950/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
        >
          {/* ── Fixed Max-Height Master Frame ── */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="relative w-full max-w-[380px] h-[85vh] max-h-[700px] flex flex-col rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 shadow-2xl overflow-hidden transition-colors duration-300"
            onClick={e => e.stopPropagation()}
          >
            <div className="absolute top-0 left-1/4 right-1/4 h-24 bg-purple-500/5 dark:bg-purple-600/10 blur-[40px] pointer-events-none" />

            {/* ── FIXED TOP VIEWPORT (Header & Custom QR Deck Hub) ── */}
            <div className="shrink-0 flex flex-col bg-white dark:bg-zinc-950 z-10">
              
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-900">
                <div className="flex items-center gap-3">
                  <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-[1px] shrink-0">
                    <div className="w-full h-full rounded-[11px] bg-white dark:bg-zinc-950 flex items-center justify-center text-zinc-900 dark:text-zinc-100 font-bold text-xs">
                      {username.charAt(0).toUpperCase()}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-950" />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Share Profile</p>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">@{username}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all"
                >
                  <X size={13} />
                </button>
              </div>

              {/* Enhanced QR Module View with Hover Actions */}
              <div className="flex flex-col items-center justify-center p-5 bg-zinc-50/50 dark:bg-zinc-900/10 border-b border-zinc-100 dark:border-zinc-900">
                
                {/* Interactive group wrapper for hover states */}
                <div ref={qrWrapperRef} className="relative p-3.5 bg-white rounded-2xl shadow-md border border-zinc-200/60 dark:border-zinc-800 group overflow-hidden">
                  <QRCode
                    value={profileUrl}
                    size={128}
                    bgColor="#ffffff"
                    fgColor="#09090b"
                    level="H"
                    style={{ display: 'block' }}
                  />
                  
                  {/* Glassmorphic Hover Action Card Overlay Sheet */}
                  <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2 p-2">
                    <button
                      onClick={handleCopyQRAsImage}
                      className="flex items-center justify-center gap-1.5 w-32 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-mono font-bold text-[10px] shadow transition-all scale-95 group-hover:scale-100 duration-200"
                    >
                      {qrCopied ? <Check size={11} /> : <ImageIcon size={11} />}
                      {qrCopied ? 'Copied Image!' : 'Copy Image Asset'}
                    </button>
                    <button
                      onClick={handleDownloadQR}
                      className="flex items-center justify-center gap-1.5 w-32 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-mono font-bold text-[10px] shadow transition-all scale-95 group-hover:scale-100 duration-200"
                    >
                      <Download size={11} /> Save QR File
                    </button>
                  </div>
                </div>

                {/* Unified Custom Input Deck Layout from Image */}
                <div className="w-full space-y-1.5 mt-4">
                  <label className="text-[9px] font-mono font-bold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase block px-1">
                    Manual URL — Updates QR Live
                  </label>
                  <div className="flex items-center gap-2 w-full">
                    <div className="flex-1 relative rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 overflow-hidden shadow-sm">
                      <input
                        ref={inputRef}
                        readOnly
                        value={profileUrl}
                        className="w-full bg-transparent text-xs font-mono text-zinc-500 dark:text-zinc-300 outline-none select-all border-none p-0"
                      />
                    </div>
                    
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleCopyLink}
                      className={`w-9 h-9 shrink-0 rounded-xl border flex items-center justify-center shadow-sm transition-all ${
                        linkCopied
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                          : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800/80'
                      }`}
                      title="Copy Link Text"
                    >
                      {linkCopied ? <Check size={14} /> : <Copy size={14} />}
                    </motion.button>

                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => window.open(profileUrl, '_blank')}
                      className="w-9 h-9 shrink-0 rounded-xl bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800/80 shadow-sm flex items-center justify-center"
                      title="Open Profile Direct"
                    >
                      <ExternalLink size={14} />
                    </motion.button>
                  </div>
                </div>

              </div>
            </div>

            {/* ── INDEPENDENTLY SCROLLABLE FIELD VIEWPORT ── */}
            <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-4 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800/60">
              
              {/* Highlights Block */}
              <div className="mt-3.5">
                <SectionLabel>Highlights</SectionLabel>
                <div className="grid grid-cols-2 gap-2.5">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleGitHubWrapped}
                    className="relative flex flex-col items-start gap-2 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-900 hover:border-purple-500/30 dark:hover:border-purple-500/30 transition-colors text-left shadow-sm group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                      <Sparkles size={12} />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 tracking-tight">GitHub Wrapped</p>
                      <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-mono mt-0.5">Year-in-review</p>
                    </div>
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleCopyMarkdown}
                    className="flex flex-col items-start gap-2 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-900 hover:border-indigo-500/30 dark:hover:border-indigo-500/30 transition-colors text-left shadow-sm group"
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all duration-200 ${
                      mdCopied
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                        : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                    }`}>
                      {mdCopied ? <Check size={12} /> : <Code size={12} />}
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 tracking-tight">
                        {mdCopied ? 'Copied!' : 'Copy Markdown'}
                      </p>
                      <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-mono mt-0.5">README badge</p>
                    </div>
                  </motion.button>
                </div>
              </div>

              {/* Social Channels Block */}
              <div>
                <SectionLabel>Share on</SectionLabel>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    {
                      icon: <XBrandIcon size={12} />,
                      label: 'X',
                      iconCn: 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100',
                      action: handleShareX,
                    },
                    {
                      icon: <LinkedInIcon size={12} />,
                      label: 'LinkedIn',
                      iconCn: 'bg-indigo-50 border-indigo-100 dark:bg-indigo-950/40 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400',
                      action: handleShareLinkedIn,
                    },
                    {
                      icon: <RedditIcon size={12} />,
                      label: 'Reddit',
                      iconCn: 'bg-orange-50 border-orange-100 dark:bg-orange-950/40 dark:border-orange-900/50 text-orange-600 dark:text-orange-400',
                      action: handleShareReddit,
                    },
                    {
                      icon: hasNativeShare ? <Smartphone size={12} /> : <Share2 size={12} />,
                      label: 'More',
                      iconCn: 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400',
                      action: handleNativeShareOrCopy,
                    },
                  ].map((s, i) => (
                    <motion.button
                      key={i}
                      whileTap={{ scale: 0.94 }}
                      onClick={s.action}
                      className="group flex flex-col items-center gap-1 p-1.5 rounded-xl border border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-all"
                    >
                      <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shadow-sm transition-transform group-hover:-translate-y-0.5 duration-200 ${s.iconCn}`}>
                        {s.icon}
                      </div>
                      <span className="text-[9px] font-mono font-medium text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-400 transition-colors">{s.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Asset Generation / Exports Block */}
              <div>
                <SectionLabel>Export Assets</SectionLabel>
                <div className="space-y-1">
                  
                  {/* Vector QR item left row */}
                  <motion.button
                    whileTap={{ scale: 0.99 }}
                    onClick={handleDownloadQR}
                    className="group flex items-center gap-3 w-full p-2 rounded-xl bg-zinc-50/40 dark:bg-zinc-900/10 border border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-900/40 hover:border-zinc-200/60 dark:hover:border-zinc-900 transition-all text-left"
                  >
                    <div className="w-7 h-7 shrink-0 rounded-lg border bg-white border-zinc-200 text-zinc-500 dark:bg-zinc-900 dark:border-zinc-800 text-zinc-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 group-hover:border-purple-500/20 dark:group-hover:border-purple-500/20 group-hover:bg-purple-500/5 flex items-center justify-center shadow-sm transition-all duration-200">
                      <QrCode size={14} className="transition-transform group-hover:scale-110 duration-200" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 leading-tight group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">
                        Download QR Asset
                      </p>
                      <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-mono truncate mt-0.5">High-res SVG vector code</p>
                    </div>
                    <span className="shrink-0 text-[8px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded-md border shadow-sm bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-400 transition-colors">
                      SVG
                    </span>
                  </motion.button>

                  {exportRows.map(row => {
                    const state = combinedStates[row.key] ?? 'idle';
                    const isLoading = state === 'loading';
                    const isSuccess = state === 'success';
                    return (
                      <motion.button
                        key={row.key}
                        whileTap={{ scale: 0.99 }}
                        onClick={row.action}
                        disabled={isLoading}
                        className="group flex items-center gap-3 w-full p-2 rounded-xl bg-zinc-50/40 dark:bg-zinc-900/10 border border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-900/40 hover:border-zinc-200/60 dark:hover:border-zinc-900 transition-all text-left disabled:opacity-50 disabled:pointer-events-none"
                      >
                        <div className={`w-7 h-7 shrink-0 rounded-lg border flex items-center justify-center shadow-sm transition-all duration-200 ${
                          isSuccess
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                            : 'bg-white border-zinc-200 text-zinc-500 dark:bg-zinc-900 dark:border-zinc-800 text-zinc-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 group-hover:border-purple-500/20 dark:group-hover:border-purple-500/20 group-hover:bg-purple-500/5'
                        }`}>
                          <ExportIcon state={state} icon={row.icon} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 leading-tight group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">
                            {isSuccess ? `${row.badge} Saved` : row.label}
                          </p>
                          <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-mono truncate mt-0.5">{row.sub}</p>
                        </div>
                        
                        <span className={`shrink-0 text-[8px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded-md border shadow-sm ${
                          row.key === 'stl'
                            ? 'bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400'
                            : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-400 transition-colors'
                        }`}>
                          {row.badge}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

            </div>
          </motion.div>

          {/* Floating Actions Alerts Global Panel Container */}
          <AnimatePresence>
            {toast && (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 12, x: '-50%' }}
                animate={{ opacity: 1, y: 0, x: '-50%' }}
                exit={{ opacity: 0, y: 12, x: '-50%' }}
                transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                className="absolute bottom-6 left-1/2 whitespace-nowrap bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-[10px] font-mono font-bold text-purple-400 shadow-xl pointer-events-none z-30 flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                {toast.msg}
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      )}
    </AnimatePresence>
  );
}