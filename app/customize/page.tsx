'use client';

import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react';
import { validateGitHubUsername } from '@/lib/validations';
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

// ─── Main Page ────────────────────────────────────────────────────────────────

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
    if (!validateGitHubUsername(trimmedUsername)) {
      setSvgContent('');
      setSvgState('error');
      setErrorMessage("That doesn't look like a valid GitHub username");
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
  }, [previewSrc, hasUsername, trimmedUsername]);

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
    window.setTimeout(() => {
      setCopyStatusMessage(message);
    }, 0);
  }, []);

  const copyExportSnippet = async (): Promise<void> => {
    if (!hasUsername) return;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(exportSnippet);
      } else {
        const copiedSuccessfully = fallbackCopyToClipboard(exportSnippet);

        if (!copiedSuccessfully) {
          throw new Error('Fallback clipboard copy failed.');
        }
      }

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

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
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
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black dark:text-white/55 dark:hover:text-white transition-colors group"
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
            <span className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-600 dark:text-emerald-400">
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
          <p className="text-gray-600 dark:text-white/65 text-sm max-w-xl">
            Every change below updates the preview in real-time. Copy the export snippet when
            you&apos;re done. No extra steps required.
          </p>
        </motion.div>

        {/* ── Split layout ─────────────────────────────────────────────────── */}
        <div className="grid lg:grid-cols-[380px_1fr] xl:grid-cols-[340px_1fr_340px] gap-6 items-start">
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
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-600 dark:text-emerald-400 mb-5">
                Live Preview
              </p>

              <div className="group relative">
                {/* Glow ring */}
                <div className="absolute -inset-px bg-gradient-to-br from-emerald-500/20 to-purple-500/20 rounded-[1.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-lg pointer-events-none" />

                <InteractiveViewer className="relative bg-white/60 backdrop-blur-md border border-black/10 dark:bg-black/40 dark:border-white/10 rounded-[1.25rem] flex items-center justify-center p-6 min-h-[280px]">
                  {/* Scanning line effect behind image */}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/3 to-transparent animate-[pulse_3s_ease-in-out_infinite] pointer-events-none" />

                  {hasUsername ? (
                    <div className="w-full flex items-center justify-center">
                      {svgState === 'loading' && (
                        <div className="h-[240px] w-full max-w-[600px] rounded-2xl bg-black/5 dark:bg-white/5 animate-pulse flex items-center justify-center text-sm text-gray-500 dark:text-white/40">
                          Loading preview...
                        </div>
                      )}
                      {svgState === 'error' &&
                        errorMessage === "That doesn't look like a valid GitHub username" && (
                          <div className="flex flex-col items-center justify-center gap-2 text-center py-8">
                            <p className="text-sm font-semibold text-red-500 dark:text-red-400">
                              {errorMessage}
                            </p>
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
                      {svgState === 'error' &&
                        errorMessage !== 'GitHub user not found' &&
                        errorMessage !== "That doesn't look like a valid GitHub username" && (
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
                    <div className="relative z-10 flex w-full max-w-xl flex-col items-center justify-center rounded-[1.25rem] border border-dashed border-black/10 bg-gray-100/80 backdrop-blur-md dark:border-white/10 dark:bg-white/3 px-6 py-12 text-center">
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-black/10 bg-gray-100/80 dark:border-white/10 dark:bg-white/4 text-gray-500 dark:text-emerald-300/70">
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
                      <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-500 dark:text-white/65">
                        The live badge preview will appear here once a username is added.
                      </p>
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
                      </span>
                    );
                  }
                )}
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
