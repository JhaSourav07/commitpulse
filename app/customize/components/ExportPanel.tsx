import { useState } from 'react';
import { toast } from 'sonner';
import type { ReactElement } from 'react';
import type { ExportFormat } from '../types';
import { getPlaceholderSnippet } from '../utils';

const EXPORT_FORMATS: { value: ExportFormat; label: string }[] = [
  { value: 'markdown', label: 'Markdown' },
  { value: 'html', label: 'HTML' },
  { value: 'action', label: 'GitHub Action' },
];

export function ExportPanel({
  format,
  snippet,
  copied,
  copyStatusMessage,
  hasUsername,
  username,
  onFormatChange,
  onCopy,
}: {
  format: ExportFormat;
  snippet: string;
  copied: boolean;
  copyStatusMessage: string;
  hasUsername: boolean;
  username: string;
  onFormatChange: (format: ExportFormat) => void;
  onCopy: () => void | Promise<void>;
}): ReactElement {
  const activeSnippet = hasUsername ? snippet : getPlaceholderSnippet(format);
  const formatLabel =
    format === 'markdown' ? 'Markdown' : format === 'action' ? 'GitHub Action' : 'HTML';
  const copyButtonLabel = hasUsername
    ? format === 'action'
      ? 'Copy GitHub Action workflow to clipboard'
      : `Copy ${formatLabel} export snippet to clipboard`
    : `Add a GitHub username to enable copying the ${formatLabel} export snippet`;

  // Track async server download states
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

      // 8. Instantiate a virtual link and fire an automated native download with a unique timestamp
      const downloadUrl = URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = downloadUrl;
      downloadLink.download = `commitpulse-${username || 'badge'}.svg`;
      document.body.appendChild(downloadLink);
      downloadLink.click();

      // 9. Housekeeping memory cleanup optimization
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Failed to download custom vector badge image asset:', error);
      toast.error('Failed to download the badge. Please try again.');
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
          <p className="mt-1 text-[11px] text-gray-500 dark:text-white/60">
            Switch formats without changing the live badge configuration.
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
                onClick={() => onFormatChange(option.value)}
                aria-pressed={format === option.value}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  format === option.value
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 shadow-[0_0_24px_rgba(16,185,129,0.16)]'
                    : 'text-gray-600 hover:text-black bg-gray-100/70 dark:bg-transparent dark:text-white/60 dark:hover:text-white'
                }`}
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
            disabled={!hasUsername || isDownloading || format === 'action'}
            aria-label={
              !hasUsername
                ? 'Add a GitHub username to enable image downloads'
                : format === 'action'
                  ? 'Download is not available in GitHub Action mode'
                  : 'Download custom monolith layout as an image'
            }
            className={`relative inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
              !hasUsername || isDownloading || format === 'action'
                ? 'bg-gray-200/90 border border-black/10 text-gray-500 cursor-not-allowed dark:bg-white/10 dark:border-white/10 dark:text-white/35'
                : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/20 hover:scale-[1.03] active:scale-[0.97]'
            }`}
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
            {format === 'action'
              ? 'Download Not Available'
              : isDownloading
                ? 'Downloading...'
                : 'Download Badge'}
          </button>

          {/* Copy — primary CTA */}
          <button
            id="copy-markdown-btn"
            onClick={onCopy}
            disabled={!hasUsername}
            aria-label={hasUsername ? copyButtonLabel : 'Add a username to copy'}
            aria-describedby="export-copy-status"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[10px] text-[11px] font-semibold transition-all duration-150"
            style={
              !hasUsername
                ? disabledStyle
                ? 'bg-gray-200/90 border border-black/10 text-gray-500 cursor-not-allowed dark:bg-white/10 dark:border-white/10 dark:text-white/60'
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
                Copy {format === 'action' ? 'workflow' : formatLabel}
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
      <div className="mt-4 text-[11px] text-gray-500 dark:text-white/20 leading-relaxed space-y-3 px-5 py-3">
      <div className="mt-4 text-[11px] text-gray-500 dark:text-white/60 leading-relaxed space-y-3">
        {format === 'action' ? (
          <>
            <p>
              <strong>Step 1:</strong> Save the workflow snippet above as{' '}
              <code className="text-gray-700 dark:text-white/75">
                .github/workflows/commitpulse.yml
              </code>{' '}
              to automatically fetch and commit your customized badge.
            </p>
            <p>
              <strong>Step 2:</strong> Embed the generated SVG into your{' '}
              <code className="text-gray-700 dark:text-white/75">README.md</code> using the markdown
              below:
            </p>
            <div className="mt-2 bg-gray-100/80 dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 flex items-center justify-between group">
              <code className="text-emerald-600 dark:text-emerald-300 font-mono select-all">
                ![CommitPulse](commitpulse.svg)
              </code>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText('![CommitPulse](commitpulse.svg)');
                }}
                className="text-gray-400 hover:text-emerald-500 transition-colors"
                title="Copy Step 2 markdown"
                aria-label="Copy Step 2 markdown snippet"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3.5 w-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
            </div>
          </>
        ) : (
          <p>
            Paste this into your GitHub profile&apos;s{' '}
            <code className="text-gray-700 dark:text-white/75">README.md</code>. The badge renders
            server-side, no script required.
          </p>
        )}
      </div>
    </div>
  );
}
