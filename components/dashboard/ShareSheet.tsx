'use client';

import { fallbackCopyToClipboard } from '@/utils/clipboard';
import {
  useEffect,
  useRef,
  useState,
  useCallback,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'react-qr-code';
import { Check, Code, Copy, Download, ExternalLink, Loader2, Sparkles, X } from 'lucide-react';
import type { DashboardExportData } from '@/types/dashboard';
import { useShareActions } from '@/hooks/useShareActions';
import { useTranslation } from '@/context/TranslationContext';
import NextImage from 'next/image';

type OptionState = 'idle' | 'loading' | 'success' | 'error';

export interface ShareSheetProps {
  username: string;
  isOpen: boolean;
  onClose: () => void;
  exportData: DashboardExportData;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-1 pt-2 pb-1.5">
      <span className="text-[10px] font-mono font-bold uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500">
        {children}
      </span>
      <div className="flex-1 h-px bg-linear-to-r from-zinc-200 to-transparent dark:from-zinc-800" />
    </div>
  );
}

const XIcon = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.63L18.244 2.25Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const LinkedInIcon = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const RedditIcon = ({ size = 20 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <circle cx="10" cy="10" r="10" fill="#FF4500" />
    <ellipse cx="10" cy="13.2" rx="4.8" ry="3.2" fill="white" />
    <circle cx="10" cy="8.5" r="3.4" fill="white" />
    <line
      x1="11.8"
      y1="6.0"
      x2="13.6"
      y2="4.4"
      stroke="white"
      strokeWidth="1.1"
      strokeLinecap="round"
    />
    <circle cx="13.9" cy="4.1" r="1.1" fill="white" />
    <circle cx="8.6" cy="8.3" r="1.05" fill="#FF4500" />
    <circle cx="8.6" cy="8.3" r="0.55" fill="red" />
    <circle cx="11.4" cy="8.3" r="1.05" fill="#FF4500" />
    <circle cx="11.4" cy="8.3" r="0.55" fill="red" />
    <path
      d="M8.2 10.1 Q10 11.4 11.8 10.1"
      stroke="#FF4500"
      strokeWidth="0.75"
      fill="none"
      strokeLinecap="round"
    />
    <circle cx="6.8" cy="13.1" r="1.1" fill="white" />
    <circle cx="6.8" cy="13.1" r="0.55" fill="#FF4500" />
    <circle cx="13.2" cy="13.1" r="1.1" fill="white" />
    <circle cx="13.2" cy="13.1" r="0.55" fill="#FF4500" />
  </svg>
);

const SystemShareIcon = ({ size = 12 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" y1="2" x2="12" y2="15" />
  </svg>
);

const WhatsAppIcon = ({ size = 15 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
    <path d="M19.11 17.21c-.29-.14-1.7-.84-1.96-.94-.26-.1-.45-.14-.64.14-.19.29-.74.94-.91 1.13-.17.19-.33.22-.62.07-.29-.14-1.2-.44-2.28-1.4-.84-.75-1.41-1.68-1.58-1.97-.17-.29-.02-.44.13-.58.13-.13.29-.33.43-.5.14-.17.19-.29.29-.48.1-.19.05-.36-.02-.5-.07-.14-.64-1.55-.88-2.12-.23-.55-.47-.48-.64-.49h-.55c-.19 0-.5.07-.76.36-.26.29-1 1-.96 2.44.05 1.44 1.04 2.84 1.19 3.03.14.19 2.05 3.13 4.96 4.39.69.3 1.23.48 1.65.62.69.22 1.31.19 1.81.12.55-.08 1.7-.69 1.94-1.36.24-.67.24-1.24.17-1.36-.07-.12-.26-.19-.55-.33z" />
  </svg>
);

function GitHubAvatar({ username }: { username: string }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setSrc(`https://avatars.githubusercontent.com/${username}?size=64`);
    img.onerror = () => setSrc(null);
    img.src = `https://avatars.githubusercontent.com/${username}?size=64`;
  }, [username]);

  if (src) {
    return (
      <NextImage
        src={src}
        alt={username}
        width={36}
        height={36}
        className="w-9 h-9 rounded-full ring-2 ring-zinc-200 dark:ring-zinc-700 object-cover shrink-0"
        unoptimized
      />
    );
  }

  return (
    <div className="w-9 h-9 rounded-full bg-linear-to-br from-zinc-300 to-zinc-400 dark:from-zinc-600 dark:to-zinc-700 ring-2 ring-zinc-200 dark:ring-zinc-700 flex items-center justify-center shrink-0">
      <span className="text-[13px] font-bold text-white uppercase leading-none">
        {username.charAt(0)}
      </span>
    </div>
  );
}

export default function ShareSheet({ username, isOpen, onClose, exportData }: ShareSheetProps) {
  const { t } = useTranslation();
  const overlayRef = useRef<HTMLDivElement>(null);
  const qrWrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [linkCopied, setLinkCopied] = useState(false);
  const [qrCopied, setQrCopied] = useState(false);
  const [mdCopied, setMdCopied] = useState(false);
  const [toast, setToast] = useState<{ msg: string; id: number } | null>(null);

  const profileUrl = `https://commitpulse.vercel.app/dashboard/${username}`;

  const handleWhatsApp = () => {
    const text = encodeURIComponent(profileUrl);

    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const {
    states,
    handleTwitter,
    handleLinkedIn,
    handleReddit,
    handleDownloadPNG,
    handleDownloadWEBP,
    handleDownloadSVG,
    handleCopyMarkdown,
    handleDownloadJSON,
    handleDownloadSTL,
    handleNativeShare,
  } = useShareActions(username, exportData, onClose);

  const combinedStates: Record<string, OptionState> = states;

  const panelRef = useRef<HTMLDivElement>(null);
  const handlePanelKeyDown = useCallback((e: ReactKeyboardEvent) => {
    if (e.key !== 'Tab' || !panelRef.current) return;

    const focusableElements = panelRef.current.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const activeEl = document.activeElement;
    const isFocusInPanel = panelRef.current.contains(activeEl);

    if (!isFocusInPanel) {
      e.preventDefault();
      firstElement.focus();
      return;
    }

    if (e.shiftKey) {
      if (activeEl === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      if (activeEl === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }, []);

  useEffect(() => {
    if (isOpen && panelRef.current) {
      const firstFocusable = panelRef.current.querySelector<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled])'
      );
      firstFocusable?.focus();
    }
  }, [isOpen]);

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

  const showToast = useCallback((msg: string) => {
    const id = Date.now();
    setToast({ msg, id });
    setTimeout(() => setToast((t) => (t?.id === id ? null : t)), 2400);
  }, []);

  const handleLocalCopyLink = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(profileUrl);
        } catch {
          const copiedSuccessfully = fallbackCopyToClipboard(profileUrl);

          if (!copiedSuccessfully) {
            throw new Error('Clipboard copy failed');
          }
        }
      } else {
        const copiedSuccessfully = fallbackCopyToClipboard(profileUrl);

        if (!copiedSuccessfully) {
          throw new Error('Clipboard copy failed');
        }
      }

      setLinkCopied(true);
      showToast(`✓ ${t('dashboard.share.link_copied')}`);
      setTimeout(() => setLinkCopied(false), 2200);
    } catch {
      showToast('Unable to copy link');
    }
  };

  const handleCopyQRAsImage = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const svgElement = qrWrapperRef.current?.querySelector('svg');
    if (!svgElement) return;

    try {
      const svgString = new XMLSerializer().serializeToString(svgElement);
      const blobURL = URL.createObjectURL(new Blob([svgString], { type: 'image/svg+xml' }));
      const image = new Image();
      image.onload = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, 512, 512);
          ctx.drawImage(image, 32, 32, 448, 448);
          const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/png'));
          if (blob && navigator.clipboard && navigator.clipboard.write) {
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
            setQrCopied(true);
            showToast('✓ QR Image Copied!');
            setTimeout(() => setQrCopied(false), 2500);
          }
        }
        URL.revokeObjectURL(blobURL);
      };
      image.src = blobURL;
    } catch {
      showToast('Copy blocked by environment');
    }
  };

  const handleDownloadQR = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const svgElement = qrWrapperRef.current?.querySelector('svg');
    if (svgElement) {
      const svgString = new XMLSerializer().serializeToString(svgElement);
      const url = URL.createObjectURL(new Blob([svgString], { type: 'image/svg+xml' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${username}-qr.svg`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('✓ QR Saved');
    }
  };

  const handleLocalCopyMarkdown = () => {
    handleCopyMarkdown();
    setMdCopied(true);
    showToast(`✓ ${t('dashboard.share.link_copied')}`); // fall back or show toast
    setTimeout(() => setMdCopied(false), 2200);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          id="share-sheet-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Backdrop — hidden from assistive tech */}
          <motion.div
            ref={overlayRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Dialog panel */}
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-sheet-title"
            onKeyDown={handlePanelKeyDown}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="relative w-full max-w-[380px] h-[85vh] max-h-[680px] flex flex-col rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden"
          >
            {/* Top Branding Section */}
            <div className="shrink-0 bg-white dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-900 px-4 pt-4 pb-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {/* Avatar — larger, ring + subtle shadow */}
                <div className="relative shrink-0">
                  <GitHubAvatar username={username} />
                  {/* Online indicator dot */}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-950" />
                </div>
                {/* Text block */}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p
                      id="share-sheet-title"
                      className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-50 leading-tight truncate"
                    >
                      {username}
                    </p>
                    {/* GitHub mark */}
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="text-zinc-400 dark:text-zinc-500 shrink-0"
                      aria-hidden="true"
                    >
                      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
                    </svg>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label={t('dashboard.share.close_aria')}
                className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Scroll Container Core Viewport */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* QR Core Deck Module */}
              <div className="flex flex-col items-center justify-center bg-zinc-50/50 dark:bg-zinc-900/10 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-900">
                <div
                  ref={qrWrapperRef}
                  className="relative p-3 bg-white rounded-xl shadow-sm border border-zinc-200/60 group overflow-hidden"
                >
                  <QRCode
                    value={profileUrl}
                    size={120}
                    bgColor="#ffffff"
                    fgColor="#09090b"
                    level="Q"
                  />
                  <div className="absolute inset-0 bg-zinc-950/80 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-1.5 p-2">
                    <button
                      type="button"
                      onClick={handleCopyQRAsImage}
                      className="w-28 py-1 rounded bg-purple-600 text-white font-mono text-[9px] font-bold"
                    >
                      {qrCopied ? 'Copied!' : 'Copy Image'}
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadQR}
                      className="w-28 py-1 rounded bg-zinc-800 text-zinc-200 font-mono text-[9px] font-bold"
                    >
                      Save File
                    </button>
                  </div>
                </div>

                <div className="w-full mt-4 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 overflow-hidden">
                      <input
                        ref={inputRef}
                        readOnly
                        aria-label="Your CommitPulse profile URL"
                        value={profileUrl}
                        className="w-full bg-transparent text-xs font-mono text-zinc-500 dark:text-zinc-300 outline-none select-all"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleLocalCopyLink}
                      className="p-2 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-lg shadow-sm"
                    >
                      {linkCopied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                    <button
                      type="button"
                      aria-label="Open profile in new tab"
                      onClick={() => window.open(profileUrl, '_blank')}
                      className="p-2 bg-white border border-zinc-200 text-zinc-600 rounded-lg dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400"
                    >
                      <ExternalLink size={14} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Social Channels */}
              <div>
                <SectionLabel>{t('dashboard.share.social_channels')}</SectionLabel>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleTwitter}
                    className="p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl text-left font-medium text-xs flex items-center gap-2 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                  >
                    <XIcon size={15} /> {t('dashboard.share.share_x')}
                  </button>
                  <button
                    type="button"
                    onClick={handleLinkedIn}
                    className="p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl text-left font-medium text-xs flex items-center gap-2 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                  >
                    <LinkedInIcon size={15} /> {t('dashboard.share.share_linkedin')}
                  </button>
                  <button
                    type="button"
                    onClick={handleReddit}
                    className="p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl text-left font-medium text-xs flex items-center gap-2 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                  >
                    <RedditIcon size={15} /> {t('dashboard.share.share_reddit')}
                  </button>
                  <button
                    onClick={handleWhatsApp}
                    className="p-2 bg-gradient-to-r from-green-500 to-green-700 text-white rounded-xl text-left font-medium text-xs flex items-center gap-2 hover:opacity-90 transition-opacity"
                  >
                    <WhatsAppIcon size={15} /> WhatsApp
                  </button>
                  <button
                    onClick={handleNativeShare}
                    className="p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl text-left font-medium text-xs flex items-center gap-2 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                  >
                    <SystemShareIcon size={15} /> {t('dashboard.share.share_os')}
                  </button>
                </div>
              </div>

              {/* Export Assets Blocks Area */}
              <div>
                <SectionLabel>{t('dashboard.share.export_options')}</SectionLabel>
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      window.open(`/dashboard/${username}/wrapped`, '_blank');
                      onClose();
                    }}
                    className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 rounded-xl text-left flex items-center gap-3 border border-transparent hover:border-zinc-200"
                  >
                    <div className="w-6 h-6 rounded bg-purple-500/10 flex items-center justify-center text-purple-600">
                      <Sparkles size={12} />
                    </div>
                    <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      {t('dashboard.share.github_wrapped')}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={handleLocalCopyMarkdown}
                    className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 rounded-xl text-left flex items-center gap-3 border border-transparent hover:border-zinc-200"
                  >
                    <div className="w-6 h-6 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
                      <Code size={12} />
                    </div>
                    <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      {mdCopied ? 'Copied Snippet!' : t('dashboard.share.copy_markdown')}
                    </p>
                  </button>

                  {[
                    {
                      key: 'png',
                      label: t('dashboard.share.download_png'),
                      action: handleDownloadPNG,
                    },
                    {
                      key: 'webp',
                      label: t('dashboard.share.download_webp'),
                      action: handleDownloadWEBP,
                    },
                    {
                      key: 'svg',
                      label: t('dashboard.share.download_svg'),
                      action: handleDownloadSVG,
                    },
                    {
                      key: 'json',
                      label: t('dashboard.share.download_json'),
                      action: handleDownloadJSON,
                    },
                    {
                      key: 'stl',
                      label: t('dashboard.share.download_stl'),
                      action: handleDownloadSTL,
                    },
                  ].map((row) => {
                    const rowState = combinedStates[row.key] ?? 'idle';
                    const isDisabled =
                      'disabled' in row && row.disabled ? true : rowState === 'loading';
                    return (
                      <button
                        type="button"
                        key={row.key}
                        onClick={row.action}
                        disabled={isDisabled}
                        className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 rounded-xl text-left flex items-center justify-between border border-transparent hover:border-zinc-200 disabled:opacity-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
                            {rowState === 'loading' ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Download size={12} />
                            )}
                          </div>
                          <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                            {rowState === 'success' ? t('dashboard.share.downloaded') : row.label}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Toast Notification Deck Frame */}
          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: 12, x: '-50%' }}
                animate={{ opacity: 1, y: 0, x: '-50%' }}
                exit={{ opacity: 0, y: 12, x: '-50%' }}
                className="absolute bottom-6 left-1/2 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-[10px] font-mono font-bold text-purple-400 shadow-xl pointer-events-none z-30 flex items-center gap-2"
              >
                {toast.msg}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
}
