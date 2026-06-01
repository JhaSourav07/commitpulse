'use client';

import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ControlsPanel } from './components/ControlsPanel';
import { AdvancedSettingsPanel } from './components/AdvancedSettingsPanel';
import { ExportPanel } from './components/ExportPanel';
import InteractiveViewer from '@/components/InteractiveViewer';
import DOMPurify from 'dompurify';
import type {
  ExportFormat,
  Font,
  Scale,
  BadgeSize,
  ViewMode,
  DeltaFormat,
  Language,
  Timezone,
} from './types';
import { getExportSnippet, buildQueryParams } from './utils';

export default function CustomizePage(): ReactElement {
  const [username, setUsername] = useState('');
  const [theme, setTheme] = useState('dark');
  const [bgHex, setBgHex] = useState('');
  const [accentHex, setAccentHex] = useState('');
  const [textHex, setTextHex] = useState('');
  const [scale, setScale] = useState<Scale>('linear');
  const [speed, setSpeed] = useState('8s');
  const [font, setFont] = useState<Font>('Inter');
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
  const [timezone, setTimezone] = useState<Timezone>('UTC');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('markdown');
  const [copied, setCopied] = useState(false);
  const [copyStatusMessage, setCopyStatusMessage] = useState('');
  const copyResetTimeoutRef = useRef<number | null>(null);

  const [svgContent, setSvgContent] = useState<string>('');
  const [svgState, setSvgState] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const trimmedUsername = username.trim();
  const hasUsername = trimmedUsername.length > 0;
  const isRandomTheme = theme === 'random';

  useEffect(() => {
    return () => {
      if (copyResetTimeoutRef.current !== null) window.clearTimeout(copyResetTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        const input = document.querySelector<HTMLInputElement>('#username-input');
        if (!input || document.activeElement === input) return;
        e.preventDefault();
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
    if (timezone !== 'UTC') params.set('tz', timezone);
    return params.toString();
  }, [
    hasUsername,
    trimmedUsername,
  const queryString = buildQueryParams({
    username,
    theme,
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
    timezone,
  });
  const previewSrc = `/api/streak?${queryString}`;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setErrorMessage(null);
    if (!hasUsername) {
      setSvgContent('');
      setSvgState('idle');
      return;
    }

    setSvgState('loading');
    const controller = new AbortController();

    fetch(previewSrc, { signal: controller.signal })
      .then(async (res) => {
        const text = await res.text();
        if (!res.ok) {
          setSvgContent('');
          setSvgState('error');
          if (res.status === 404 || res.status === 400) {
            setErrorMessage('GitHub user not found');
          } else if (res.status === 429) {
            setErrorMessage('Rate limit exceeded. Please try again later.');
          } else {
            setErrorMessage('Failed to load badge');
          }
          return;
        }
        return text;
      })
      .then((text) => {
        if (!text) return;
        // Sanitize SVG using DOMPurify with the SVG profile.
        // - Forbid risky tags like foreignObject and embedded content
        // - Forbid xlink:href to avoid external references
        // - Use a conservative URI whitelist to prevent javascript: URIs
        const sanitized = DOMPurify.sanitize(text, {
          USE_PROFILES: { svg: true },
          ADD_TAGS: ['animate', 'style'],
          ADD_ATTR: [
            'fill',
            'fill-opacity',
            'stroke',
            'stroke-width',
            'stroke-opacity',
            'x1',
            'y1',
            'x2',
            'y2',
            'stop-color',
            'stop-opacity',
            'offset',
            'transform-origin',
            'transform-box',
            'transform',
            'attributeName',
            'from',
            'to',
            'dur',
            'repeatCount',
            'id',
            'class',
            'href',
          ],
          FORBID_TAGS: ['foreignObject', 'iframe', 'object', 'embed', 'script'],
          FORBID_ATTR: ['xlink:href'],
          ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|data):|#)/i,
        });

        setSvgContent(sanitized as string);
        setSvgState('loaded');
        setErrorMessage(null);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setSvgState('error');
        setErrorMessage('Failed to load badge');
      });

    return () => controller.abort();
  }, [previewSrc, hasUsername]);

  const exportSnippet = getExportSnippet(exportFormat, queryString);

  const fallbackCopy = (text: string): boolean => {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  };

  const announceCopyStatus = useCallback((msg: string): void => {
    setCopyStatusMessage('');
    window.setTimeout(() => setCopyStatusMessage(msg), 0);
  }, []);

  const copyExportSnippet = async (): Promise<void> => {
    if (!hasUsername) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(exportSnippet);
      } else {
        if (!fallbackCopy(exportSnippet)) throw new Error('Fallback copy failed.');
      }
      setCopied(true);
      announceCopyStatus(`${exportFormat === 'markdown' ? 'Markdown' : 'HTML'} snippet copied.`);
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
      {/* ── Ambient background ──────────────────────────────────────────── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div
          className="absolute -top-[20%] -left-[8%] w-[45%] h-[45%] rounded-full blur-[160px]"
          style={{
            background: 'radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute top-[30%] -right-[10%] w-[35%] h-[35%] rounded-full blur-[140px]"
          style={{
            background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute bottom-[10%] left-[30%] w-[30%] h-[30%] rounded-full blur-[120px]"
          style={{
            background: 'radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)',
          }}
        />
        {/* Dot grid */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
            maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)',
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
        {/* ── Breadcrumb ──────────────────────────────────────────────────── */}
        <motion.nav
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-2 mb-10"
          aria-label="Breadcrumb"
        >
          <Link
            href="/"
            id="back-to-home-link"
            className="group inline-flex items-center gap-1.5 text-[12px] text-white/35 hover:text-white/65 transition-colors duration-150"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black dark:text-white/55 dark:hover:text-white transition-colors group"
          >
            <svg
              className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform duration-150"
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
          <span className="text-white/15 text-[12px]">/</span>
          <span className="text-[12px] text-white/50 font-medium">Customization Studio</span>

          {/* Live pill */}
          <div
            className="ml-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium text-emerald-400/85"
            style={{
              background: 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.2)',
            }}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
            </span>
            Live
          </div>
        </motion.nav>

        {/* ── Page heading ────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="mb-10"
        >
          <h1 className="text-[2rem] sm:text-[2.4rem] font-extrabold tracking-tight leading-[1.12] mb-3">
            Fine-tune your{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: 'linear-gradient(90deg, #34d399 0%, #6ee7b7 50%, #a7f3d0 100%)',
              }}
            >
              monolith.
            </span>
          </h1>
          <p className="text-[13px] text-white/40 max-w-md leading-relaxed">
            Every change updates the preview in real-time. Copy the export snippet when you&apos;re
            done — no extra steps required.
          <p className="text-gray-600 dark:text-white/65 text-sm max-w-xl">
            Every change below updates the preview in real-time. Copy the export snippet when
            you&apos;re done. No extra steps required.
          </p>
        </motion.div>

        {/* ── Two-column layout ───────────────────────────────────────────── */}
        <div className="grid lg:grid-cols-[360px_1fr] xl:grid-cols-[376px_1fr] gap-5 items-start">
          {/* ════ LEFT: Controls sidebar ════════════════════════════════════ */}
          <motion.aside
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="sticky top-6"
          >
            <div className="cp-card overflow-hidden" style={{ maxHeight: 'calc(100vh - 3rem)' }}>
              {/* Emerald top accent */}
              <div
                className="h-px w-full"
                style={{
                  background:
                    'linear-gradient(90deg, transparent 5%, rgba(16,185,129,0.5) 50%, transparent 95%)',
                }}
              />
              <div
                className="p-5 overflow-y-auto"
                style={{ maxHeight: 'calc(100vh - 3rem - 1px)' }}
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
                  hideTitle={hideTitle}
                  hideBackground={hideBackground}
                  hideStats={hideStats}
                  viewMode={viewMode}
                  deltaFormat={deltaFormat}
                  badgeWidth={badgeWidth}
                  badgeHeight={badgeHeight}
                  grace={grace}
                  language={language}
                  timezone={timezone}
                  onHideTitleChange={setHideTitle}
                  onHideBackgroundChange={setHideBackground}
                  onHideStatsChange={setHideStats}
                  onViewModeChange={setViewMode}
                  onDeltaFormatChange={setDeltaFormat}
                  onBadgeWidthChange={setBadgeWidth}
                  onBadgeHeightChange={setBadgeHeight}
                  onGraceChange={setGrace}
                  onLanguageChange={setLanguage}
                  onTimezoneChange={setTimezone}
                />
              </div>
            </div>
          </motion.aside>

          {/* ════ RIGHT: Preview + Export + Params ══════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="flex flex-col gap-5"
          >
            {/* ── Live Preview ──────────────────────────────────────────── */}
            <div className="cp-card overflow-hidden">
              <div
                className="h-px w-full"
                style={{
                  background:
                    'linear-gradient(90deg, transparent 5%, rgba(255,255,255,0.08) 50%, transparent 95%)',
                }}
              />

              {/* Preview header */}
              <div
                className="flex items-center justify-between px-5 py-3.5"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: '#34d399', boxShadow: '0 0 6px rgba(52,211,153,0.7)' }}
                  />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-400/80">
                    Live Preview
                  </span>
                </div>
                <span className="text-[11px] text-white/28">
                  {hasUsername
                    ? isRandomTheme
                      ? 'Random — no cache'
                      : 'Cached at UTC midnight'
                    : 'Enter a username to preview'}
                </span>
              </div>

              {/* Preview canvas */}
              <div className="p-5">
                <InteractiveViewer className="relative bg-white/60 backdrop-blur-md border border-black/10 dark:bg-black/40 dark:border-white/10 rounded-[1.25rem] flex items-center justify-center p-6 min-h-[280px]">
                  {/* Scanning line effect behind image */}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/3 to-transparent animate-[pulse_3s_ease-in-out_infinite] pointer-events-none" />

                  {hasUsername ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={previewSrc}
                      src={previewSrc}
                      alt="CommitPulse live preview"
                      width={600}
                      height={420}
                      className="relative z-10 max-w-full h-auto"
                      style={{ filter: 'drop-shadow(0 16px 40px rgba(0,0,0,0.7))' }}
                    />
                    <div className="w-full flex items-center justify-center">
                      {svgState === 'loading' && (
                        <div className="h-[240px] w-full max-w-[600px] rounded-2xl bg-black/5 dark:bg-white/5 animate-pulse flex items-center justify-center text-sm text-gray-500 dark:text-white/40">
                          Loading preview...
                        </div>
                      )}
                      {svgState === 'error' && errorMessage === 'GitHub user not found' && (
                        <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
                          <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-red-500/20 bg-red-500/10 shadow-inner">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-8 w-8 text-red-500"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          </div>
                          <div>
                            <p className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                              GitHub user not found
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              Please check the username and try again.
                            </p>
                          </div>
                        </div>
                      )}
                      {svgState === 'error' && errorMessage !== 'GitHub user not found' && (
                        <div className="flex flex-col items-center justify-center gap-2 text-center py-8">
                          <p className="text-sm font-semibold text-red-500 dark:text-red-400">
                            Failed to load badge
                          </p>
                          <p className="text-xs text-gray-500 dark:text-white/45">
                            The API may be unavailable. Please try again.
                          </p>
                        </div>
                      )}
                      {svgState === 'loaded' && svgContent && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                          className="cp-svg-container w-full max-w-[600px] drop-shadow-[0_30px_60px_rgba(0,0,0,0.15)] dark:drop-shadow-[0_30px_60px_rgba(0,0,0,0.5)] [&>svg]:w-full [&>svg]:h-auto"
                          dangerouslySetInnerHTML={{ __html: svgContent }}
                        />
                      )}
                      {svgState === 'loaded' && !svgContent && errorMessage && (
                        <p className="text-red-400 text-sm text-center">{errorMessage}</p>
                      )}
                    </div>
                  ) : (
                    <div className="relative z-10 flex flex-col items-center justify-center px-8 py-14 text-center">
                      {/* Icon */}
                      <div
                        className="mb-5 w-14 h-14 rounded-2xl flex items-center justify-center"
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.08)',
                        }}
                      >
                        <svg
                          className="w-6 h-6 text-white/20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                          <path d="M9 18c-4.51 2-5-2-7-2" />
                        </svg>
                      </div>
                      <p className="text-[15px] font-semibold tracking-tight text-white/55 mb-2">
                        Enter a GitHub username
                      </p>
                      <p className="text-[12px] text-white/28 max-w-[240px] leading-relaxed">
                        Your live badge preview will appear here once a username is added.
                      <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-500 dark:text-white/65">
                        The live badge preview will appear here once a username is added.
                      </p>
                      <div
                        className="mt-5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.07)',
                        }}
                      >
                        <kbd className="text-[10px] font-mono text-white/30">⌘K</kbd>
                        <span className="text-[10px] text-white/22">to focus username field</span>
                      </div>
                    </div>
                  )}
                </InteractiveViewer>
              </div>

              <p className="mt-3 text-[11px] text-gray-500 dark:text-white/55 text-center">
                {hasUsername
                  ? isRandomTheme
                    ? 'Random theme changes on every page load and disables caching'
                    : 'Preview updates on every change. Hosted badge is cached at UTC midnight'
                  : 'Add a username to enable live preview and export snippets'}
              </p>
            </div>

            {/* ── Export Panel ──────────────────────────────────────────── */}
            <ExportPanel
              format={exportFormat}
              snippet={exportSnippet}
              copied={copied}
              copyStatusMessage={copyStatusMessage}
              hasUsername={hasUsername}
              username={trimmedUsername}
              onFormatChange={setExportFormat}
              onCopy={copyExportSnippet}
            />

            {/* ── Active Parameters ─────────────────────────────────────── */}
            <div className="cp-card overflow-hidden">
              <div
                className="h-px w-full"
                style={{
                  background:
                    'linear-gradient(90deg, transparent 5%, rgba(255,255,255,0.06) 50%, transparent 95%)',
                }}
              />
              <div className="px-5 py-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30 mb-3 leading-none">
                  Active Parameters
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(hasUsername ? queryString.split('&') : ['user=your-github-username']).map(
                    (pair) => {
                      const eqIdx = pair.indexOf('=');
                      const k = pair.slice(0, eqIdx);
                      const v = pair.slice(eqIdx + 1);
                      return (
                        <span
                          key={k}
                          className="inline-flex items-center gap-1 rounded-[8px] px-2.5 py-1 text-[11px] font-mono transition-colors duration-150"
                          style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.07)',
                          }}
                        >
                          <span style={{ color: 'rgba(167,139,250,0.8)' }}>
                            {decodeURIComponent(k)}
                          </span>
                          <span style={{ color: 'rgba(255,255,255,0.18)' }}>=</span>
                          <span style={{ color: 'rgba(52,211,153,0.75)' }}>
                            {decodeURIComponent(v)}
                          </span>
            {/* URL breakdown */}
            <div className="bg-white/70 backdrop-blur-xl border border-black/10 dark:bg-black/35 dark:border-white/10 rounded-[1.75rem] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-500 dark:text-white/55 mb-4">
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
                        <span className="text-gray-400 dark:text-white/55">=</span>
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {decodeURIComponent(v)}
                        </span>
                      );
                    }
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* ════ RIGHT: Advanced Settings ═══════════════════════════════════ */}
          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white/70 backdrop-blur-xl border border-black/10 dark:bg-black/35 dark:border-white/10 rounded-[1.75rem] p-6 flex flex-col gap-6 sticky top-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] xl:col-start-3"
          >
            <AdvancedSettingsPanel
              hideTitle={hideTitle}
              hideBackground={hideBackground}
              hideStats={hideStats}
              viewMode={viewMode}
              deltaFormat={deltaFormat}
              badgeWidth={badgeWidth}
              badgeHeight={badgeHeight}
              grace={grace}
              language={language}
              timezone={timezone}
              onHideTitleChange={setHideTitle}
              onHideBackgroundChange={setHideBackground}
              onHideStatsChange={setHideStats}
              onViewModeChange={setViewMode}
              onDeltaFormatChange={setDeltaFormat}
              onBadgeWidthChange={setBadgeWidth}
              onBadgeHeightChange={setBadgeHeight}
              onGraceChange={setGrace}
              onLanguageChange={setLanguage}
              onTimezoneChange={setTimezone}
            />
          </motion.aside>
        </div>
      </div>
    </div>
  );
}
