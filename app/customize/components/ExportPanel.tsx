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

      // 1. Extract the API URL source string from the template snippet container
      const urlMatch = snippet.match(/\((https?:\/\/[^)]+)\)/) || snippet.match(/src="([^"]+)"/);
      let targetUrl = urlMatch ? urlMatch[1] : '';

      if (!targetUrl) {
        console.error('Could not parse the live API badge target URL from snippet.');
        return;
      }

      // 2. Clear out HTML character entities if grabbed from HTML embed strings
      targetUrl = targetUrl.replace(/&amp;/g, '&');

      // 3. SECURE LOCAL WORKSPACE TESTING: Redirect backend calls to your local server instance
      if (targetUrl.includes('https://commitpulse.vercel.app')) {
        targetUrl = targetUrl.replace('https://commitpulse.vercel.app', window.location.origin);
      }

      // 4. Append a cache-busting refresh query parameter to guarantee the latest custom colors
      if (targetUrl.includes('?')) {
        targetUrl += '&refresh=true';
      } else {
        targetUrl += '?refresh=true';
      }

      // 5. Fetch the real, server-side generated raw XML text of the SVG from your local server
      const response = await fetch(targetUrl);
      if (!response.ok) throw new Error('Network response failed to retrieve badge data stream.');

      let svgText = await response.text();

      // 6. ABSOLUTE VIEWPORT CENTERING INJECTION
      // We attach absolute positioning properties directly into the root vector stylesheet.
      // This forces the standalone browser view to scale up and lock dead center in the viewport grid!
      const standaloneStyles = `
        <style id="standalone-canvas-centering">
          svg {
            display: block !important;
            margin: auto !important;
            position: absolute !important;
            top: 0 !important; bottom: 0 !important;
            left: 0 !important; right: 0 !important;
            max-width: 90vw !important;
            max-height: 85vh !important;
            width: 100% !important;
            height: 100% !important;
          }
          html, body {
            background-color: #0d1117 !important; /* Premium matching background void */
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
          }
        </style>
      `;

      // Inject directly right after the opening tag to guarantee compilation matching
      svgText = svgText.replace(/<svg[^>]*>/, (match) => `${match}${standaloneStyles}`);

      // 7. Convert the modified markup string into an optimal vector image blob buffer
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

  return (
    <div className="bg-white/70 backdrop-blur-xl border border-black/10 dark:bg-black/35 dark:border-white/10 rounded-[1.75rem] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
      <div className="flex flex-col gap-4 mb-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-600 dark:text-emerald-400">
            {formatLabel} Export Snippet
          </p>
          <p className="mt-1 text-[11px] text-gray-500 dark:text-white/60">
            Switch formats without changing the live badge configuration.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div
            className="inline-flex rounded-xl border border-black/10 bg-white/60 backdrop-blur-md dark:border-white/10 dark:bg-white/[0.03] p-1"
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
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 shadow-[0_0_24px_rgba(16,185,129,0.16)]'
                    : 'text-gray-600 hover:text-black bg-gray-100/70 dark:bg-transparent dark:text-white/60 dark:hover:text-white'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Centered High-Definition Vector Download Button */}
          <button
            type="button"
            onClick={handleDownloadBadge}
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
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </>
              )}
            </svg>
            {format === 'action'
              ? 'Download Not Available'
              : isDownloading
                ? 'Downloading...'
                : 'Download Badge'}
          </button>

          {/* Clipboard Copy Button */}
          <button
            id="copy-markdown-btn"
            onClick={onCopy}
            disabled={!hasUsername}
            aria-label={copyButtonLabel}
            aria-describedby="export-copy-status"
            className={`relative inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
              !hasUsername
                ? 'bg-gray-200/90 border border-black/10 text-gray-500 cursor-not-allowed dark:bg-white/10 dark:border-white/10 dark:text-white/60'
                : copied
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                  : 'bg-gray-200/90 border border-black/10 text-gray-800 hover:bg-gray-300/80 hover:scale-[1.03] active:scale-[0.97] dark:bg-white dark:text-black'
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

      <div className="bg-gray-100/80 backdrop-blur-md border border-black/10 dark:bg-white/[0.03] dark:border-white/10 rounded-xl px-5 py-4 overflow-x-auto">
        <code className="text-emerald-600 dark:text-emerald-300 text-xs font-mono leading-relaxed break-all whitespace-pre-wrap">
          {activeSnippet}
        </code>
      </div>

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
