'use client';

import { fallbackCopyToClipboard } from '@/utils/clipboard';
import { useCallback, useEffect, useRef, useState, Suspense, type ReactElement } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { validateGitHubUsername } from '@/lib/validations';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ControlsPanel } from './components/ControlsPanel';
import { AdvancedSettingsPanel } from './components/AdvancedSettingsPanel';
import { ExportPanel } from './components/ExportPanel';
import InteractiveViewer from '@/components/InteractiveViewer';
import { Footer } from '@/app/components/Footer';
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

import { useDebounce } from '@/hooks/useDebounce';
import useFetchCache from '@/hooks/useFetchCache';
import { getExportSnippet, buildQueryParams, streakErrorMessage } from './utils';
import { useTranslation } from '@/context/TranslationContext';

function readNumericSearchParam(
  searchParams: URLSearchParams,
  key: string,
  fallback: number | '',
  min?: number,
  max?: number
): number | '' {
  const raw = searchParams.get(key);
  if (!raw) return fallback;

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
    return fallback;
  }

  if (min !== undefined && parsed < min) return fallback;
  if (max !== undefined && parsed > max) return fallback;

  return parsed;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function CustomizePageInner(): ReactElement {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [theme, setTheme] = useState('dark');
  const [bgHex, setBgHex] = useState('');
  const [bgType, setBgType] = useState<'solid' | 'linear' | 'radial'>('solid');
  const [bgStart, setBgStart] = useState('');
  const [bgEnd, setBgEnd] = useState('');
  const [bgAngle, setBgAngle] = useState<number>(90);
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
  const svgCache = useFetchCache<string>();
  const [svgState, setSvgState] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const trimmedUsername = username.trim();
  const hasUsername = trimmedUsername.length > 0;
  const isRandomTheme = theme === 'random';

  const router = useRouter();
  const searchParams = useSearchParams();

  // On mount: initialize state from URL search params
  // Multiple setState calls are intentional here — we sync every customization
  // control from the URL once on mount so that shared/bookmarked links restore
  // the full editor state. Each setter corresponds to a single URL param and
  // they all run synchronously in a single effect pass, so React batches them
  // into one re-render. No stale-dependency risk: deps are intentionally [].
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const u = searchParams.get('user') ?? '';
    const t = searchParams.get('theme') ?? 'dark';
    setUsername(u);
    setTheme(t);
    setBgHex(searchParams.get('bg') ?? '');
    setBgType((searchParams.get('bgType') as 'solid' | 'linear' | 'radial') ?? 'solid');
    setBgStart(searchParams.get('bgStart') ?? '');
    setBgEnd(searchParams.get('bgEnd') ?? '');
    setBgAngle(readNumericSearchParam(searchParams, 'bgAngle', 90, 0, 360) as number);
    setAccentHex(searchParams.get('accent') ?? '');
    setTextHex(searchParams.get('text') ?? '');
    setScale((searchParams.get('scale') as Scale) ?? 'linear');
    setSpeed(searchParams.get('speed') ?? '8s');
    setFont((searchParams.get('font') as Font) ?? 'Inter');
    setYear(searchParams.get('year') ?? '');
    setRadius(readNumericSearchParam(searchParams, 'radius', 8, 0, 50) as number);
    setSize((searchParams.get('size') as BadgeSize) ?? 'medium');
    setHideTitle(searchParams.get('hide_title') === 'true');
    setHideBackground(searchParams.get('hide_background') === 'true');
    setHideStats(searchParams.get('hide_stats') === 'true');
    setViewMode((searchParams.get('view') as ViewMode) ?? 'default');
    setDeltaFormat((searchParams.get('delta_format') as DeltaFormat) ?? 'percent');
    setBadgeWidth(readNumericSearchParam(searchParams, 'width', '', 100, 1200));
    setBadgeHeight(readNumericSearchParam(searchParams, 'height', '', 80, 800));
    setGrace(readNumericSearchParam(searchParams, 'grace', 1, 0, 7) as number);
    setLanguage((searchParams.get('lang') as Language) ?? 'en');
    setTimezone((searchParams.get('tz') as Timezone) ?? 'UTC');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

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
      setBgType('solid');
      setBgStart('');
      setBgEnd('');
      setBgAngle(90);
      setAccentHex('');
      setTextHex('');
    }
  }, []);

  const queryString = buildQueryParams({
    username,
    theme,
    bgHex,
    bgType,
    bgStart,
    bgEnd,
    bgAngle,
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

  // ─── DEBOUNCE ALL PAGE PARAMETERS AT ONCE ──────────────────────────────────
  // Instead of debouncing a single string, we pass the built query string
  // through the hook to hold off any API fetch request during rapid changes!
  const debouncedQueryString = useDebounce(queryString, 400);

  const previewSrc = `/api/streak?${debouncedQueryString}`;

  // On change sync state to URL
  useEffect(() => {
    if (!queryString) return;
    // Guard: skip router.replace when the URL already matches the computed params.
    // Without this, router.replace fires on every mount (including remounts caused by
    // template.tsx), creating an infinite reload loop in production.
    if (window.location.search === `?${queryString}`) return;
    router.replace(`/customize?${queryString}`, { scroll: false });
  }, [queryString, router]);

  useEffect(() => {
    // Safe: resets error state as the first synchronous step when any preview
    // dependency changes. The reset always precedes any async fetch or early
    // return so there is no intermediate render with stale error text.
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
    const cached = svgCache.get(previewSrc);

    if (cached) {
      setSvgContent(cached);
      setSvgState('loaded');
      return;
    }

    fetch(previewSrc, { signal: controller.signal })
      .then(async (res) => {
        const text = await res.text();
        if (!res.ok) {
          setSvgContent('');
          setSvgState('error');
          setErrorMessage(streakErrorMessage(res.status));
          return;
        }
        return text;
      })
      .then((text) => {
        if (!text) return;

        // Ensure we strictly sanitize the raw SVG markup using DOMPurify,
        // while preserving the necessary layout and structural attributes our SVG requires.
        const sanitized = DOMPurify.sanitize(text, {
          USE_PROFILES: { svg: true, svgFilters: true },
          ADD_TAGS: [
            'animate',
            'style',
            'filter',
            'feGaussianBlur',
            'feMerge',
            'feMergeNode',
            'feComposite',
          ],
          ADD_ATTR: [
            'viewBox',
            'd',
            'width',
            'height',
            'rx',
            'ry',
            'transform-origin',
            'transform-box',
            'animation-delay',
            'xmlns',
            'font-family',
            'font-size',
            'font-weight',
            'fill-opacity',
            'filter',
            'stdDeviation',
            'result',
            'in',
            'in2',
            'operator',
            'x',
            'y',
            'id',
          ],
        });

        svgCache.set(previewSrc, sanitized);
        setSvgContent(sanitized);
        setSvgState('loaded');
        setErrorMessage(null);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setSvgState('error');
        setErrorMessage('Failed to load badge');
      });

    return () => controller.abort();
    // By changing this list, useEffect only runs when previewSrc finishes debouncing
  }, [previewSrc, hasUsername, trimmedUsername, svgCache]);

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
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(exportSnippet);
        } catch {
          const copiedSuccessfully = fallbackCopyToClipboard(exportSnippet);

          if (!copiedSuccessfully) {
            throw new Error('Fallback clipboard copy failed.');
          }
        }
      } else {
        const copiedSuccessfully = fallbackCopyToClipboard(exportSnippet);

        if (!copiedSuccessfully) {
          throw new Error('Fallback clipboard copy failed.');
        }
      }

      setCopied(true);

      announceCopyStatus(
        exportFormat === 'markdown'
          ? t('customize.export.copy_status_markdown_success', {
              defaultValue: 'Markdown snippet copied to clipboard.',
            })
          : exportFormat === 'html'
            ? t('customize.export.copy_status_html_success', {
                defaultValue: 'HTML snippet copied to clipboard.',
              })
            : exportFormat === 'tsx'
              ? t('customize.export.copy_status_tsx_success', {
                  defaultValue: 'React TSX snippet copied to clipboard.',
                })
              : t('customize.export.copy_status_action_success', {
                  defaultValue: 'GitHub Action snippet copied to clipboard.',
                })
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
        t('customize.export.copy_status_error', {
          defaultValue: `Unable to copy the ${exportFormat === 'markdown' ? 'Markdown' : 'HTML'} snippet.`,
        })
      );
    }
  };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDownloadimage = () => {
    alert('Download image functionality coming soon!');
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
            {t('customize.back_to_home')}
          </Link>

          <div className="h-4 w-px bg-white/10" />

          <div>
            <span className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-600 dark:text-emerald-400">
              {t('customize_cta.studio_badge')}
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
            {t('customize.title')}
          </h1>
          <p className="text-gray-600 dark:text-white/65 text-sm max-w-xl">{t('customize.desc')}</p>
        </motion.div>

        {/* ── Split layout ─────────────────────────────────────────────────── */}
        <div className="grid lg:grid-cols-[380px_1fr] xl:grid-cols-[340px_1fr_340px] gap-6 items-start">
          {/* ════ LEFT: Control Panel ════════════════════════════════════════ */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white/70 backdrop-blur-xl border border-black/10 dark:bg-black/35 dark:border-white/10 rounded-[1.75rem] p-6 flex flex-col gap-6 sticky top-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] min-w-0"
          >
            <ControlsPanel
              username={username}
              theme={theme}
              bgHex={bgHex}
              bgType={bgType}
              bgStart={bgStart}
              bgEnd={bgEnd}
              bgAngle={bgAngle}
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
              onBgTypeChange={setBgType}
              onBgStartChange={setBgStart}
              onBgEndChange={setBgEnd}
              onBgAngleChange={setBgAngle}
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
                setBgType('solid');
                setBgStart('');
                setBgEnd('');
                setBgAngle(90);
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
            className="flex flex-col gap-6 min-w-0"
          >
            {/* Live Preview */}
            <div className="bg-white/70 backdrop-blur-xl border border-black/10 dark:bg-black/35 dark:border-white/10 rounded-[1.75rem] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-600 dark:text-emerald-400 mb-5">
                {t('customize.live_preview')}
              </p>

              {/* ─── MOVING THE INTERACTION LISTENER DIRECTLY TO THE OUTER WRAPPER CONTAINER ROW ─── */}
              <div
                className="group relative"
                onClick={(e) => {
                  // Only trigger the focus highlight workflow if the placeholder box is actively rendering
                  if (!hasUsername) {
                    e.stopPropagation();
                    const input = document.getElementById('username-input') as HTMLInputElement;
                    if (input) {
                      input.focus();
                      input.style.outline = '4px solid #10b981';
                      input.style.outlineOffset = '2px';
                      input.style.transform = 'scale(1.02)';
                      input.style.transition = 'all 0.3s ease';

                      setTimeout(() => {
                        input.style.outline = 'none';
                        input.style.transform = 'scale(1)';
                      }, 1000);
                    }
                  }
                }}
              >
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
                          id="export-container"
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
                    <div className="relative z-10 flex w-full max-w-xl flex-col items-center justify-center rounded-[1.25rem] border border-dashed border-black/10 bg-gray-100/80 backdrop-blur-md dark:border-white/10 dark:bg-white/3 hover:border-black/30 dark:hover:border-white/30 transition-colors cursor-pointer px-6 py-12 text-center">
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
                        {t('landing.preview_placeholder_title')}
                      </p>
                      <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-500 dark:text-white/65">
                        {t('customize.empty_preview_desc')}
                      </p>
                    </div>
                  )}
                </InteractiveViewer>
              </div>

              <p className="mt-3 text-[11px] text-gray-500 dark:text-white/55 text-center">
                {hasUsername
                  ? isRandomTheme
                    ? t('landing.preview_auto_theme')
                    : t('landing.preview_caching_tip')
                  : t('landing.preview_empty_tip')}
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
                {t('customize.active_params')}
              </p>
              <div className="flex flex-wrap gap-2">
                {(hasUsername ? queryString.split('&') : ['user=your-github-username']).map(
                  (pair) => {
                    const [k, v] = pair.split('=');
                    return (
                      <span
                        key={k}
                        className="inline-flex items-center gap-1.5 bg-gray-100/80 backdrop-blur-md border border-black/10 dark:bg-white/[0.03] dark:border-white/10 rounded-lg px-3 py-1.5 text-xs font-mono break-all"
                      >
                        <span className="text-purple-400 break-all">{decodeURIComponent(k)}</span>
                        <span className="text-gray-400 dark:text-white/55 shrink-0">=</span>
                        <span className="text-emerald-600 dark:text-emerald-400 break-all">
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
            className="bg-white/70 backdrop-blur-xl border border-black/10 dark:bg-black/35 dark:border-white/10 rounded-[1.75rem] p-6 flex flex-col gap-6 sticky top-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] xl:col-start-3 min-w-0"
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
      <Footer />
    </div>
  );
}

export default function CustomizePage(): ReactElement {
  return (
    <Suspense fallback={<div className="min-h-screen bg-transparent" />}>
      <CustomizePageInner />
    </Suspense>
  );
}
