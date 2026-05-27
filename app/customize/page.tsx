'use client';

import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ControlsPanel } from './components/ControlsPanel';
import { ExportPanel } from './components/ExportPanel';
import type { ExportFormat, Font, Scale, BadgeSize } from './types';
import { getExportSnippet, stripHash } from './utils';

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CustomizePage(): ReactElement {
  const [username, setUsername] = useState('');
  const [theme, setTheme] = useState('dark');
  const [bgHex, setBgHex] = useState('');
  const [accentHex, setAccentHex] = useState('');
  const [textHex, setTextHex] = useState('');
  const [scale, setScale] = useState<Scale>('linear');
  const [speed, setSpeed] = useState('8s');
  const [font, setFont] = useState<Font>('');
  const [year, setYear] = useState('');
  const [radius, setRadius] = useState(8);
  const [size, setSize] = useState<BadgeSize>('medium');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('markdown');
  const [copied, setCopied] = useState(false);
  const [copyStatusMessage, setCopyStatusMessage] = useState('');
  const copyResetTimeoutRef = useRef<number | null>(null);
  const trimmedUsername = username.trim();
  const hasUsername = trimmedUsername.length > 0;
  const isAutoTheme = theme === 'auto';
  const isRandomTheme = theme === 'random';
  const skipsCustomColors = isAutoTheme || isRandomTheme;

  useEffect(() => {
    return () => {
      if (copyResetTimeoutRef.current !== null) {
        window.clearTimeout(copyResetTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        const input = document.querySelector<HTMLInputElement>('#username-input');
        if (!input || document.activeElement === input) return;
        event.preventDefault();
        input.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Clear custom hex overrides when switching to virtual themes because
  // fixed colors conflict with their palette-selection behavior.
  const handleThemeChange = useCallback((newTheme: string): void => {
    setTheme(newTheme);
    if (newTheme === 'auto' || newTheme === 'random') {
      setBgHex('');
      setAccentHex('');
      setTextHex('');
    }
  }, []);

  // ── buildQueryParams ──────────────────────────────────────────────────────

  const buildQueryParams = useCallback((): string => {
    const params = new URLSearchParams();

    if (hasUsername) {
      params.set('user', trimmedUsername);
    }

    if (skipsCustomColors) {
      // Virtual themes always emit theme=<name> and skip custom color params.
      params.set('theme', theme);
    } else {
      const hasCustomColors = bgHex || accentHex || textHex;

      // Custom hex colors take priority over theme
      if (!hasCustomColors) {
        params.set('theme', theme);
      }
      if (bgHex) params.set('bg', stripHash(bgHex));
      if (accentHex) params.set('accent', stripHash(accentHex));
      if (textHex) params.set('text', stripHash(textHex));
    }

    if (scale !== 'linear') params.set('scale', scale);
    if (speed !== '8s') params.set('speed', speed);
    if (font) params.set('font', font);
    if (year) params.set('year', year);
    if (radius !== 8) params.set('radius', radius.toString());
    if (size !== 'medium') params.set('size', size);
    return params.toString();
  }, [
    hasUsername,
    trimmedUsername,
    theme,
    skipsCustomColors,
    bgHex,
    accentHex,
    textHex,
    scale,
    speed,
    font,
    year,
    radius,
    size,
  ]);

  const queryString = buildQueryParams();
  const previewSrc = `/api/streak?${queryString}`;
  const exportSnippet = getExportSnippet(exportFormat, queryString);

  const announceCopyStatus = useCallback((message: string): void => {
    setCopyStatusMessage('');
    window.setTimeout(() => {
      setCopyStatusMessage(message);
    }, 0);
  }, []);

  const copyExportSnippet = async (): Promise<void> => {
    if (!hasUsername) return;

    try {
      await navigator.clipboard.writeText(exportSnippet);
      setCopied(true);
      announceCopyStatus(
        `${exportFormat === 'markdown' ? 'Markdown' : 'HTML'} snippet copied to clipboard.`
      );

      if (copyResetTimeoutRef.current !== null) {
        window.clearTimeout(copyResetTimeoutRef.current);
      }

      copyResetTimeoutRef.current = window.setTimeout(() => {
        setCopied(false);
        setCopyStatusMessage('');
      }, 3000);
    } catch {
      setCopied(false);
      announceCopyStatus(
        `Unable to copy the ${exportFormat === 'markdown' ? 'Markdown' : 'HTML'} snippet.`
      );
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-white font-sans overflow-x-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[35%] h-[35%] bg-emerald-500/8 blur-[120px] rounded-full" />
        <div className="absolute top-[30%] -right-[10%] w-[25%] h-[25%] bg-purple-500/8 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-1/2 w-[30%] h-[30%] bg-blue-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 py-8">
        {/* ── Top Bar ───────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-4 mb-8"
        >
          <Link
            href="/"
            id="back-to-home-link"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black dark:text-white/40 dark:hover:text-white transition-colors group"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back to Home
          </Link>

          <div className="h-4 w-px bg-white/10" />

          <div>
            <span className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-400">
              Customization Studio
            </span>
          </div>
        </motion.div>

        {/* ── Page heading ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="mb-10"
        >
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-black dark:text-white leading-tight mb-2">
            Fine-tune your monolith.
          </h1>
          <p className="text-gray-600 dark:text-white/50 text-sm max-w-xl">
            Every change below updates the preview in real-time. Copy the export snippet when
            you&apos;re done. No extra steps required.
          </p>
        </motion.div>

        {/* ── Split layout ─────────────────────────────────────────────────── */}
        <div className="grid lg:grid-cols-[380px_1fr] gap-6 items-start">
          {/* ════ LEFT: Control Panel ════════════════════════════════════════ */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white/70 backdrop-blur-xl border border-black/10 dark:bg-black/35 dark:border-white/10 rounded-[1.75rem] p-6 flex flex-col gap-6 sticky top-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
          >
            <ControlsPanel
              username={username}
              theme={theme}
              bgHex={bgHex}
              accentHex={accentHex}
              textHex={textHex}
              scale={scale}
              speed={speed}
              font={font}
              year={year}
              radius={radius}
              size={size}
              onUsernameChange={setUsername}
              onThemeChange={handleThemeChange}
              onBgHexChange={setBgHex}
              onAccentHexChange={setAccentHex}
              onTextHexChange={setTextHex}
              onScaleChange={setScale}
              onSpeedChange={setSpeed}
              onFontChange={setFont}
              onYearChange={setYear}
              onRadiusChange={setRadius}
              onSizeChange={setSize}
              onClearOverrides={() => {
                setBgHex('');
                setAccentHex('');
                setTextHex('');
              }}
            />
          </motion.aside>

          {/* ════ RIGHT: Preview + Export ════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="flex flex-col gap-6"
          >
            {/* Live Preview */}
            <div className="bg-white/70 backdrop-blur-xl border border-black/10 dark:bg-black/35 dark:border-white/10 rounded-[1.75rem] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-400 mb-5">
                Live Preview
              </p>

              <div className="group relative">
                {/* Glow ring */}
                <div className="absolute -inset-px bg-gradient-to-br from-emerald-500/20 to-purple-500/20 rounded-[1.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-lg pointer-events-none" />

                <div className="relative bg-white/60 backdrop-blur-md border border-black/10 dark:bg-black/40 dark:border-white/10 rounded-[1.25rem] overflow-hidden flex items-center justify-center p-6 min-h-[280px]">
                  {/* Scanning line effect behind image */}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/3 to-transparent animate-[pulse_3s_ease-in-out_infinite] pointer-events-none" />

                  {hasUsername ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        key={previewSrc}
                        src={previewSrc}
                        alt="CommitPulse live preview"
                        width={600}
                        height={420}
                        className="max-w-full h-auto drop-shadow-[0_20px_60px_rgba(0,0,0,0.6)] transition-opacity duration-300"
                      />
                    </>
                  ) : (
                    <div className="relative z-10 flex w-full max-w-xl flex-col items-center justify-center rounded-[1.25rem] border border-dashed border-black/10 bg-gray-100/80 backdrop-blur-md dark:border-white/10 dark:bg-white/[0.03] px-6 py-12 text-center">
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-black/10 bg-gray-100/80 dark:border-white/10 dark:bg-white/[0.04] text-gray-500 dark:text-emerald-300/70">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M12 19V5" />
                          <path d="m5 12 7-7 7 7" />
                        </svg>
                      </div>
                      <p className="text-lg font-semibold tracking-tight text-black dark:text-white">
                        Enter a GitHub username to preview
                      </p>
                      <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-500 dark:text-white/45">
                        The live badge preview will appear here once a username is added.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <p className="mt-3 text-[11px] text-gray-500 dark:text-white/30 text-center">
                {hasUsername
                  ? isRandomTheme
                    ? 'Random theme changes on every page load and disables caching'
                    : 'Preview updates on every change. Hosted badge is cached at UTC midnight'
                  : 'Add a username to enable live preview and export snippets'}
              </p>
            </div>

            <ExportPanel
              format={exportFormat}
              snippet={exportSnippet}
              copied={copied}
              copyStatusMessage={copyStatusMessage}
              hasUsername={hasUsername}
              onFormatChange={setExportFormat}
              onCopy={copyExportSnippet}
            />

            {/* URL breakdown */}
            <div className="bg-white/70 backdrop-blur-xl border border-black/10 dark:bg-black/35 dark:border-white/10 rounded-[1.75rem] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-500 dark:text-white/30 mb-4">
                Active Parameters
              </p>
              <div className="flex flex-wrap gap-2">
                {(hasUsername ? queryString.split('&') : ['user=your-github-username']).map(
                  (pair) => {
                    const [k, v] = pair.split('=');
                    return (
                      <span
                        key={k}
                        className="inline-flex items-center gap-1.5 bg-gray-100/80 backdrop-blur-md border border-black/10 dark:bg-white/[0.03] dark:border-white/10 rounded-lg px-3 py-1.5 text-xs font-mono"
                      >
                        <span className="text-purple-400">{decodeURIComponent(k)}</span>
                        <span className="text-gray-400 dark:text-white/20">=</span>
                        <span className="text-emerald-400">{decodeURIComponent(v)}</span>
                      </span>
                    );
                  }
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
