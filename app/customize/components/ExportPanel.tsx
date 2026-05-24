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
  onFormatChange: (format: ExportFormat) => void;
  onCopy: () => void | Promise<void>;
}): ReactElement {
  const activeSnippet = hasUsername ? snippet : getPlaceholderSnippet(format);
  const formatLabel = format === 'markdown' ? 'Markdown' : 'HTML';
  const copyButtonLabel = hasUsername
    ? `Copy ${formatLabel} export snippet to clipboard`
    : `Add a GitHub username to enable copying the ${formatLabel} export snippet`;

  return (
    <div className="bg-[#0a0a0a] border border-white/5 rounded-[1.75rem] p-6">
      <div className="flex flex-col gap-4 mb-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-400">
            {formatLabel} Export Snippet
          </p>
          <p className="mt-1 text-[11px] text-white/25">
            Switch formats without changing the live badge configuration.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div
            className="inline-flex rounded-xl border border-white/10 bg-black p-1"
            aria-label="Export format"
          >
            {EXPORT_FORMATS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onFormatChange(option.value)}
                aria-pressed={format === option.value}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  format === option.value
                    ? 'bg-emerald-500/15 text-emerald-300 shadow-[0_0_24px_rgba(16,185,129,0.16)]'
                    : 'text-white/35 hover:text-white/70'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <button
            id="copy-markdown-btn"
            onClick={onCopy}
            disabled={!hasUsername}
            aria-label={copyButtonLabel}
            aria-describedby="export-copy-status"
            className={`relative inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
              !hasUsername
                ? 'bg-white/[0.04] border border-white/8 text-white/30'
                : copied
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                  : 'bg-white text-black hover:scale-[1.03] active:scale-[0.97]'
            }`}
          >
            {copied ? (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
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

      <div className="bg-black/60 border border-white/8 rounded-xl px-5 py-4 overflow-x-auto">
        <code className="text-emerald-300 text-xs font-mono leading-relaxed break-all whitespace-pre-wrap">
          {activeSnippet}
        </code>
      </div>

      <p className="mt-4 text-[11px] text-white/20 leading-relaxed">
        Paste this into your GitHub profile&apos;s <code className="text-white/35">README.md</code>.
        The badge renders server-side, no script required.
      </p>
    </div>
  );
}
