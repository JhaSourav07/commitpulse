import { useState } from 'react';
import type { ReactElement } from 'react';
import type { ExportFormat } from '../types';
import { getPlaceholderSnippet } from '../utils';

const EXPORT_FORMATS: { value: ExportFormat; label: string }[] = [
  { value: 'markdown', label: 'Markdown' },
  { value: 'html', label: 'HTML' },
];

export function ExportPanel({
  format,
  snippet,
  copied,
  copyStatusMessage,
  hasUsername,
  onFormatChange,
  onCopy,
}: {
  format: ExportFormat;
  snippet: string;
  copied: boolean;
  copyStatusMessage: string;
  hasUsername: boolean;
  onFormatChange: (f: ExportFormat) => void;
  onCopy: () => void | Promise<void>;
}): ReactElement {
  const activeSnippet = hasUsername ? snippet : getPlaceholderSnippet(format);
  const formatLabel = format === 'markdown' ? 'Markdown' : 'HTML';
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadBadge = async () => {
    if (!hasUsername || !snippet) return;
    try {
      setIsDownloading(true);
      const urlMatch = snippet.match(/\((https?:\/\/[^)]+)\)/) || snippet.match(/src="([^"]+)"/);
      let targetUrl = urlMatch ? urlMatch[1] : '';
      if (!targetUrl) return;
      targetUrl = targetUrl.replace(/&amp;/g, '&');
      if (targetUrl.includes('https://commitpulse.vercel.app'))
        targetUrl = targetUrl.replace('https://commitpulse.vercel.app', window.location.origin);
      targetUrl += targetUrl.includes('?') ? '&refresh=true' : '?refresh=true';
      const response = await fetch(targetUrl);
      if (!response.ok) throw new Error('Network response failed.');
      let svgText = await response.text();
      const standaloneStyles = `<style id="standalone-canvas-centering">svg{display:block!important;margin:auto!important;position:absolute!important;top:0!important;bottom:0!important;left:0!important;right:0!important;max-width:90vw!important;max-height:85vh!important;width:100%!important;height:100%!important;}html,body{background-color:#0d1117!important;margin:0!important;padding:0!important;overflow:hidden!important;}</style>`;
      svgText = svgText.replace(/<svg[^>]*>/, (m) => `${m}${standaloneStyles}`);
      const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `commitpulse-badge-${Date.now()}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Download failed:', e);
      alert('Failed to download the badge.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Shared disabled style
  const disabledStyle = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    color: 'rgba(255,255,255,0.2)',
    cursor: 'not-allowed' as const,
  };

  return (
    <div className="cp-card overflow-hidden">
      {/* Top accent line */}
      <div
        className="h-px w-full"
        style={{
          background:
            'linear-gradient(90deg, transparent 5%, rgba(16,185,129,0.45) 40%, rgba(139,92,246,0.3) 70%, transparent 95%)',
        }}
      />

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div
        className="flex flex-col gap-3 px-5 pt-5 pb-4 sm:flex-row sm:items-center sm:justify-between"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] leading-none mb-1.5 text-emerald-400/80">
            {formatLabel} Export Snippet
          </p>
          <p className="text-[11px] leading-relaxed text-white/30">
            Switch formats without changing the badge configuration.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Format toggle */}
          <div
            className="inline-flex p-[3px] gap-[3px] rounded-[10px]"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {EXPORT_FORMATS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onFormatChange(opt.value)}
                aria-pressed={format === opt.value}
                className="rounded-[8px] px-3 py-1.5 text-[11px] font-semibold transition-all duration-150"
                style={
                  format === opt.value
                    ? {
                        background: 'rgba(16,185,129,0.18)',
                        border: '1px solid rgba(16,185,129,0.32)',
                        color: '#34d399',
                        boxShadow: '0 0 12px rgba(16,185,129,0.1)',
                      }
                    : { color: 'rgba(255,255,255,0.38)', border: '1px solid transparent' }
                }
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Download SVG */}
          <button
            type="button"
            onClick={handleDownloadBadge}
            disabled={!hasUsername || isDownloading}
            aria-label={hasUsername ? 'Download badge as SVG' : 'Add a username to download'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[11px] font-semibold transition-all duration-150"
            style={
              !hasUsername || isDownloading
                ? disabledStyle
                : {
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.55)',
                  }
            }
            onMouseEnter={(e) => {
              if (hasUsername && !isDownloading) {
                const b = e.currentTarget;
                b.style.background = 'rgba(255,255,255,0.08)';
                b.style.borderColor = 'rgba(255,255,255,0.16)';
                b.style.color = 'rgba(255,255,255,0.82)';
              }
            }}
            onMouseLeave={(e) => {
              if (hasUsername && !isDownloading) {
                const b = e.currentTarget;
                b.style.background = 'rgba(255,255,255,0.05)';
                b.style.borderColor = 'rgba(255,255,255,0.1)';
                b.style.color = 'rgba(255,255,255,0.55)';
              }
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`w-3.5 h-3.5 ${isDownloading ? 'animate-spin' : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {isDownloading ? (
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              ) : (
                <>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </>
              )}
            </svg>
            {isDownloading ? 'Downloading…' : 'Download SVG'}
          </button>

          {/* Copy — primary CTA */}
          <button
            id="copy-markdown-btn"
            onClick={onCopy}
            disabled={!hasUsername}
            aria-label={
              hasUsername
                ? `Copy ${formatLabel} export snippet to clipboard`
                : 'Add a username to copy'
            }
            aria-describedby="export-copy-status"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[10px] text-[11px] font-semibold transition-all duration-150"
            style={
              !hasUsername
                ? disabledStyle
                : copied
                  ? {
                      background: 'rgba(16,185,129,0.2)',
                      border: '1px solid rgba(16,185,129,0.45)',
                      color: '#34d399',
                      boxShadow: '0 0 20px rgba(16,185,129,0.18)',
                    }
                  : {
                      background: 'rgba(16,185,129,0.12)',
                      border: '1px solid rgba(16,185,129,0.28)',
                      color: 'rgba(52,211,153,0.88)',
                    }
            }
            onMouseEnter={(e) => {
              if (hasUsername && !copied) {
                const b = e.currentTarget;
                b.style.background = 'rgba(16,185,129,0.2)';
                b.style.borderColor = 'rgba(16,185,129,0.42)';
                b.style.boxShadow = '0 0 16px rgba(16,185,129,0.14)';
              }
            }}
            onMouseLeave={(e) => {
              if (hasUsername && !copied) {
                const b = e.currentTarget;
                b.style.background = 'rgba(16,185,129,0.12)';
                b.style.borderColor = 'rgba(16,185,129,0.28)';
                b.style.boxShadow = '';
              }
            }}
          >
            {copied ? (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                Copy {formatLabel}
              </>
            )}
          </button>
        </div>
      </div>

      <p
        id="export-copy-status"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {copyStatusMessage}
      </p>

      {/* ── Code editor ─────────────────────────────────────────────────── */}
      {/* Window chrome */}
      <div
        className="flex items-center gap-1.5 px-5 py-2.5"
        style={{ background: 'rgba(0,0,0,0.18)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(255,95,86,0.55)' }} />
        <span
          className="w-2.5 h-2.5 rounded-full"
          style={{ background: 'rgba(255,189,46,0.55)' }}
        />
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(39,201,63,0.55)' }} />
        <span className="ml-3 text-[10px] font-mono text-white/22">
          {format === 'markdown' ? 'README.md' : 'index.html'}
        </span>
        <span className="ml-auto text-[10px] font-mono text-white/15">
          {format === 'markdown' ? 'markdown' : 'html'}
        </span>
      </div>

      {/* Code content */}
      <div className="px-5 py-4 overflow-x-auto" style={{ background: 'rgba(0,0,0,0.12)' }}>
        <pre className="m-0 text-[12px] font-mono leading-relaxed whitespace-pre-wrap break-all text-emerald-300/72">
          <code>{activeSnippet}</code>
        </pre>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <div
        className="px-5 py-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.1)' }}
      >
        <p className="text-[11px] leading-relaxed text-white/25">
          Paste into your GitHub profile&apos;s{' '}
          <code className="font-mono text-white/40">README.md</code>. Renders server-side — no
          script required.
        </p>
      </div>
    </div>
  );
}
