'use client';

import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ControlsPanel } from './components/ControlsPanel';
import { ExportPanel } from './components/ExportPanel';
import type {
  ExportFormat,
  Font,
  Scale,
  BadgeSize,
  ViewMode,
  DeltaFormat,
  Language,
} from './types';
import { getExportSnippet, stripHash } from './utils';

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
  const [hideTitle, setHideTitle] = useState(false);
  const [hideBackground, setHideBackground] = useState(false);
  const [hideStats, setHideStats] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('default');
  const [deltaFormat, setDeltaFormat] = useState<DeltaFormat>('percent');
  const [badgeWidth, setBadgeWidth] = useState<number | ''>('');
  const [badgeHeight, setBadgeHeight] = useState<number | ''>('');
  const [grace, setGrace] = useState<number>(1);
  const [language, setLanguage] = useState<Language>('en');
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

  const handleThemeChange = useCallback((newTheme: string): void => {
    setTheme(newTheme);
    if (newTheme === 'auto' || newTheme === 'random') {
      setBgHex('');
      setAccentHex('');
      setTextHex('');
    }
  }, []);

  const buildQueryParams = useCallback((): string => {
    const params = new URLSearchParams();

    if (hasUsername) params.set('user', trimmedUsername);

    if (skipsCustomColors) {
      params.set('theme', theme);
    } else {
      const hasCustomColors = bgHex || accentHex || textHex;
      if (!hasCustomColors) params.set('theme', theme);
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
    if (hideTitle) params.set('hide_title', 'true');
    if (hideBackground) params.set('hide_background', 'true');
    if (hideStats) params.set('hide_stats', 'true');
    if (viewMode !== 'default') params.set('view', viewMode);
    if (deltaFormat !== 'percent') params.set('delta_format', deltaFormat);
    if (badgeWidth !== '') params.set('width', badgeWidth.toString());
    if (badgeHeight !== '') params.set('height', badgeHeight.toString());
    if (grace !== 1) params.set('grace', grace.toString());
    if (language !== 'en') params.set('lang', language);

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
    hideTitle,
    hideBackground,
    hideStats,
    viewMode,
    deltaFormat,
    badgeWidth,
    badgeHeight,
    grace,
    language,
  ]);

  const queryString = buildQueryParams();
  const previewSrc = `/api/streak?${queryString}`;
  const exportSnippet = getExportSnippet(exportFormat, queryString);

  const fallbackCopyToClipboard = (text: string): boolean => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      textArea.style.pointerEvents = 'none';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch {
      return false;
    }
  };

  const announceCopyStatus = useCallback((message: string): void => {
    setCopyStatusMessage('');
    window.setTimeout(() => setCopyStatusMessage(message), 0);
  }, []);

  const copyExportSnippet = async (): Promise<void> => {
    if (!hasUsername) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(exportSnippet);
      } else {
        const ok = fallbackCopyToClipboard(exportSnippet);
        if (!ok) throw new Error('Fallback clipboard copy failed.');
      }
      setCopied(true);
      announceCopyStatus(
        `${exportFormat === 'markdown' ? 'Markdown' : 'HTML'} snippet copied to clipboard.`
      );
      if (copyResetTimeoutRef.current !== null) window.clearTimeout(copyResetTimeoutRef.current);
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
    <div className="min-h-screen text-white font-sans overflow-x-hidden">
      {/* ── Ambient background orbs ─────────────────────────────────────── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-[15%] -left-[5%] w-[40%] h-[40%] bg-emerald-500/[0.06] blur-[140px] rounded-full" />
        <div className="absolute top-[25%] -right-[8%] w-[30%] h-[30%] bg-violet-500/[0.05] blur-[130px] rounded-full" />
        <div className="absolute bottom-[5%] left-[35%] w-[28%] h-[28%] bg-blue-500/[0.04] blur-[120px] rounded-full" />
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-6 py-8">
        {/* ── Top Bar ─────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex items-center gap-3 mb-10"
        >
          <Link
            href="/"
            id="back-to-home-link"
            className="inline-flex items-center gap-1.5 text-xs text-white/30 hover:text-white/70 transition-colors duration-200 group"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform duration-200"
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
            Home
          </Link>

          <span className="text-white/10">/</span>

          <span className="text-xs font-semibold text-white/50">Customization Studio</span>

          {/* Live indicator */}
          <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/[0.06]">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
            </span>
            <span className="text-[10px] font-medium text-emerald-400/80 tracking-wide">Live</span>
          </div>
        </motion.div>

        {/* ── Page Heading ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05 }}
          className="mb-10"
        >
          <h1 className="text-3xl md:text-[2.5rem] font-extrabold tracking-tight text-white leading-[1.15] mb-3">
            Fine-tune your{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              monolith.
            </span>
          </h1>
          <p className="text-white/40 text-sm max-w-lg leading-relaxed">
            Every change updates the preview in real-time. Copy the export snippet when you&apos;re
            done — no extra steps required.
          </p>
        </motion.div>

        {/* ── Split Layout ─────────────────────────────────────────────────── */}
        <div className="grid lg:grid-cols-[360px_1fr] xl:grid-cols-[380px_1fr] gap-5 items-start">
          {/* ════ LEFT: Controls ════════════════════════════════════════════ */}
          <motion.aside
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="sticky top-6"
          >
            <div className="rounded-[1.5rem] border border-white/[0.07] bg-[#0d1117]/90 backdrop-blur-2xl shadow-[0_8px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.04)] overflow-hidden">
              {/* Top accent line */}
              <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
              <div className="p-5 overflow-y-auto max-h-[calc(100vh-8rem)]">
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
                  hideTitle={hideTitle}
                  hideBackground={hideBackground}
                  hideStats={hideStats}
                  viewMode={viewMode}
                  deltaFormat={deltaFormat}
                  badgeWidth={badgeWidth}
                  badgeHeight={badgeHeight}
                  grace={grace}
                  language={language}
                  onHideTitleChange={setHideTitle}
                  onHideBackgroundChange={setHideBackground}
                  onHideStatsChange={setHideStats}
                  onViewModeChange={setViewMode}
                  onDeltaFormatChange={setDeltaFormat}
                  onBadgeWidthChange={setBadgeWidth}
                  onBadgeHeightChange={setBadgeHeight}
                  onGraceChange={setGrace}
                  onLanguageChange={setLanguage}
                />
              </div>
            </div>
          </motion.aside>

          {/* ════ RIGHT: Preview + Export ════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: 0.15 }}
            className="flex flex-col gap-5"
          >
            {/* Live Preview */}
            <div className="rounded-[1.5rem] border border-white/[0.07] bg-[#0d1117]/80 backdrop-blur-xl shadow-[0_8px_40px_rgba(0,0,0,0.4)] overflow-hidden">
              <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

              {/* Preview header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.05]">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400/80">
                    Live Preview
                  </span>
                </div>
                <span className="text-[10px] text-white/20">
                  {hasUsername
                    ? isRandomTheme
                      ? 'Random — no cache'
                      : 'Cached at UTC midnight'
                    : 'Enter a username to preview'}
                </span>
              </div>

              {/* Preview area */}
              <div className="p-6">
                <div className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden min-h-[260px] flex items-center justify-center transition-all duration-500 hover:border-white/[0.1]">
                  {/* Subtle inner glow on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                  {hasUsername ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      key={previewSrc}
                      src={previewSrc}
                      alt="CommitPulse live preview"
                      width={600}
                      height={420}
                      className="relative z-10 max-w-full h-auto drop-shadow-[0_16px_48px_rgba(0,0,0,0.7)] transition-opacity duration-300"
                    />
                  ) : (
                    <div className="relative z-10 flex flex-col items-center justify-center px-8 py-14 text-center">
                      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03] text-white/20">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <rect x="3" y="3" width="18" height="18" rx="3" />
                          <path d="M3 9h18M9 21V9" />
                        </svg>
                      </div>
                      <p className="text-base font-semibold tracking-tight text-white/60 mb-2">
                        Enter a GitHub username
                      </p>
                      <p className="text-sm text-white/25 max-w-xs leading-relaxed">
                        Your live badge preview will appear here once a username is added in the
                        controls panel.
                      </p>
                      <div className="mt-5 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02]">
                        <kbd className="text-[10px] text-white/25 font-mono">⌘K</kbd>
                        <span className="text-[10px] text-white/20">to focus username field</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Export Panel */}
            <ExportPanel
              format={exportFormat}
              snippet={exportSnippet}
              copied={copied}
              copyStatusMessage={copyStatusMessage}
              hasUsername={hasUsername}
              onFormatChange={setExportFormat}
              onCopy={copyExportSnippet}
            />

            {/* Active Parameters */}
            <div className="rounded-[1.5rem] border border-white/[0.07] bg-[#0d1117]/80 backdrop-blur-xl shadow-[0_8px_40px_rgba(0,0,0,0.3)] overflow-hidden">
              <div className="h-px bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />
              <div className="px-6 py-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/25">
                    Active Parameters
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(hasUsername ? queryString.split('&') : ['user=your-github-username']).map(
                    (pair) => {
                      const [k, v] = pair.split('=');
                      return (
                        <span
                          key={k}
                          className="inline-flex items-center gap-1 bg-white/[0.03] border border-white/[0.07] rounded-lg px-2.5 py-1.5 text-[11px] font-mono hover:border-white/[0.12] transition-colors duration-200"
                        >
                          <span className="text-violet-400/80">{decodeURIComponent(k)}</span>
                          <span className="text-white/15">=</span>
                          <span className="text-emerald-400/80">{decodeURIComponent(v)}</span>
                        </span>
                      );
                    }
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
