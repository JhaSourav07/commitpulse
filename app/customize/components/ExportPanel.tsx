import { useState } from 'react';
import { toast } from 'sonner';
import type { ReactElement } from 'react';
import type { ExportFormat } from '../types';
import { getPlaceholderSnippet } from '../utils';
import { useTranslation } from '@/context/TranslationContext';
import { Copy, Check } from 'lucide-react';

const EXPORT_FORMATS: { value: ExportFormat; labelKey: string }[] = [
  { value: 'markdown', labelKey: 'markdown' },
  { value: 'html', labelKey: 'html' },
  { value: 'tsx', labelKey: 'tsx' },
  { value: 'action', labelKey: 'action' },
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
  const { t } = useTranslation();
  const activeSnippet = hasUsername ? snippet : getPlaceholderSnippet(format);

  const formatLabel =
    format === 'markdown'
      ? t('customize.export.markdown')
      : format === 'action'
        ? t('customize.export.action')
        : format === 'tsx'
          ? t('customize.export.tsx')
          : t('customize.export.html');

  const copyButtonLabel = hasUsername
    ? format === 'action'
      ? t('customize.export.copy_aria_action_enabled', {
          defaultValue: 'Copy GitHub Action workflow to clipboard',
        })
      : format === 'tsx'
        ? t('customize.export.copy_aria_tsx_enabled', {
            defaultValue: 'Copy React TSX component to clipboard',
          })
        : t('customize.export.copy_aria_enabled', { format: formatLabel })
    : format === 'action'
      ? t('customize.export.copy_aria_action_disabled', {
          defaultValue: 'Add a GitHub username to enable copying the GitHub Action workflow',
        })
      : format === 'tsx'
        ? t('customize.export.copy_aria_tsx_disabled', {
            defaultValue: 'Add a GitHub username to enable copying the React TSX component',
          })
        : t('customize.export.copy_aria_disabled', { format: formatLabel });

  // Track async server download states
  const [isDownloading, setIsDownloading] = useState(false);
  const [filePathCopied, setFilePathCopied] = useState(false);
  const [markdownCopied, setMarkdownCopied] = useState(false);

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
            max-height: 90vh !important;
          }
        </style>
      `;

      const closingSvgTag = '</svg>';
      const injectionIndex = svgText.lastIndexOf(closingSvgTag);

      if (injectionIndex !== -1) {
        svgText =
          svgText.substring(0, injectionIndex) +
          standaloneStyles +
          svgText.substring(injectionIndex);
      }

      // 7. Initialize standard file downloader
      const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);

      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = blobUrl;
      downloadAnchor.download = `${username || 'commitpulse'}-badge.svg`;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();

      // 8. Cleanup memory references
      document.body.removeChild(downloadAnchor);
      URL.revokeObjectURL(blobUrl);

      setIsDownloading(false);
      toast.success('Badge vector asset saved successfully!');
    } catch (err) {
      setIsDownloading(false);
      console.error(err);
      toast.error('Failed to retrieve the latest badge asset. Please try again.');
    }
  };

  const handleDownloadPng = async () => {
    if (!hasUsername || !snippet) return;

    try {
      setIsDownloading(true);

      const urlMatch = snippet.match(/\((https?:\/\/[^)]+)\)/) || snippet.match(/src="([^"]+)"/);

      let targetUrl = urlMatch ? urlMatch[1] : '';

      if (!targetUrl) {
        toast.error('Could not determine badge URL.');
        return;
      }

      targetUrl = targetUrl.replace(/&amp;/g, '&');

      if (targetUrl.includes('https://commitpulse.vercel.app')) {
        targetUrl = targetUrl.replace('https://commitpulse.vercel.app', window.location.origin);
      }

      const response = await fetch(targetUrl);

      if (!response.ok) {
        throw new Error('Failed to fetch SVG');
      }

      const svgText = await response.text();

      const svgBlob = new Blob([svgText], {
        type: 'image/svg+xml;charset=utf-8',
      });

      const svgUrl = URL.createObjectURL(svgBlob);

      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');

        canvas.width = img.width || 1200;
        canvas.height = img.height || 630;

        const ctx = canvas.getContext('2d');

        if (!ctx) {
          URL.revokeObjectURL(svgUrl);
          return;
        }

        ctx.drawImage(img, 0, 0);

        canvas.toBlob((blob) => {
          if (!blob) return;

          const pngUrl = URL.createObjectURL(blob);

          const link = document.createElement('a');
          link.href = pngUrl;
          link.download = `commitpulse-${username || 'badge'}.png`;

          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          URL.revokeObjectURL(pngUrl);
        }, 'image/png');

        URL.revokeObjectURL(svgUrl);
      };

      img.src = svgUrl;
    } catch (error) {
      console.error(error);
      toast.error('Failed to download PNG badge.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Code Block Header Control Deck */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex flex-wrap sm:flex-nowrap rounded-xl border border-black/10 bg-white/60 backdrop-blur-md dark:border-white/10 dark:bg-white/[0.03] p-1"
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
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 shadow-[0_0_24px_rgba(16,185,129,0.16)]'
                    : 'text-zinc-400 dark:text-white/35 hover:text-zinc-700 dark:hover:text-white/70'
                }`}
              >
                {t(`customize.export.${option.labelKey}`)}
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
                ? t('customize.export.download_aria_disabled', {
                    defaultValue: 'Add a GitHub username to enable image downloads',
                  })
                : format === 'action'
                  ? t('customize.export.download_aria_action', {
                      defaultValue: 'Download is not available in GitHub Action mode',
                    })
                  : t('customize.export.download_aria_enabled', { username: username || 'badge' })
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
              ? t('customize.export.download_not_available')
              : isDownloading
                ? t('customize.export.downloading', { defaultValue: 'Downloading...' })
                : t('customize.export.download_svg', { defaultValue: 'Download SVG' })}
          </button>

          <button
            type="button"
            onClick={handleDownloadPng}
            disabled={!hasUsername || isDownloading || format === 'action'}
            className={`relative inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
              !hasUsername || isDownloading || format === 'action'
                ? 'bg-gray-200/90 border border-black/10 text-gray-500 cursor-not-allowed dark:bg-white/10 dark:border-white/10 dark:text-white/35'
                : 'bg-blue-500/10 border border-blue-500/30 text-blue-500 hover:bg-blue-500/20 hover:scale-[1.03] active:scale-[0.97]'
            }`}
          >
            {isDownloading
              ? t('customize.export.downloading', { defaultValue: 'Downloading...' })
              : t('customize.export.download_png', { defaultValue: 'Download PNG' })}
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
                ? 'bg-gray-200/90 border border-black/10 text-gray-500 cursor-not-allowed dark:bg-white/10 dark:border-white/10 dark:text-white/35'
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
                {t('customize.export.copied')}
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
                {format === 'action'
                  ? t('customize.export.copy_workflow')
                  : t('customize.export.copy_format', { format: formatLabel })}
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
              <strong>
                {t('customize.export.action_step_1_title', { defaultValue: 'Step 1:' })}
              </strong>{' '}
              {t('customize.export.action_step_1_body', {
                defaultValue: 'Save the workflow snippet above as ',
              })}
            </p>
            <div className="mt-2 bg-gray-100/80 dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 flex items-center justify-between group">
              <code className="text-emerald-600 dark:text-emerald-300 font-mono select-all">
                .github/workflows/commitpulse.yml
              </code>

              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText('.github/workflows/commitpulse.yml');

                  if ('vibrate' in navigator) {
                    navigator.vibrate(30);
                  }

                  setFilePathCopied(true);

                  setTimeout(() => {
                    setFilePathCopied(false);
                  }, 1000);
                }}
                className={`transition-all duration-200 ${
                  filePathCopied
                    ? 'text-emerald-500 scale-110'
                    : 'text-gray-400 hover:text-emerald-500'
                }`}
                title="Copy Step 2 markdown"
                aria-label="Copy Step 2 markdown snippet"
              >
                {filePathCopied ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
            <p>
              {t('customize.export.action_step_1_footer', {
                defaultValue: 'to automatically fetch and commit your customized badge.',
              })}
            </p>
            <p>
              <strong>
                {t('customize.export.action_step_2_title', { defaultValue: 'Step 2:' })}
              </strong>{' '}
              {t('customize.export.action_step_2_body_1', {
                defaultValue: 'Embed the generated SVG into your ',
              })}
              <code className="text-gray-700 dark:text-white/75">README.md</code>{' '}
              {t('customize.export.action_step_2_body_2', {
                defaultValue: 'using the markdown below:',
              })}
            </p>
            <div className="mt-2 bg-gray-100/80 dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 flex items-center justify-between group">
              <code className="text-emerald-600 dark:text-emerald-300 font-mono select-all">
                ![CommitPulse](commitpulse.svg)
              </code>

              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText('![CommitPulse](commitpulse.svg)');

                  if ('vibrate' in navigator) {
                    navigator.vibrate(30);
                  }

                  setMarkdownCopied(true);

                  setTimeout(() => {
                    setMarkdownCopied(false);
                  }, 1000);
                }}
                className={`transition-all duration-200 ${
                  markdownCopied
                    ? 'text-emerald-500 scale-110'
                    : 'text-gray-400 hover:text-emerald-500'
                }`}
                title="Copy Step 2 markdown"
                aria-label="Copy Step 2 markdown snippet"
              >
                {markdownCopied ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </>
        ) : format === 'tsx' ? (
          <>
            <p>
              <strong>{t('customize.export.tsx_step_1_title', { defaultValue: 'Step 1:' })}</strong>{' '}
              {t('customize.export.tsx_step_1_body_1', {
                defaultValue: 'Save the component code above as a file, e.g. ',
              })}
              <code className="text-gray-700 dark:text-white/75">CommitPulse.tsx</code>{' '}
              {t('customize.export.tsx_step_1_body_2', { defaultValue: 'in your React project.' })}
            </p>
            <p>
              <strong>{t('customize.export.tsx_step_2_title', { defaultValue: 'Step 2:' })}</strong>{' '}
              {t('customize.export.tsx_step_2_body', {
                defaultValue: 'Import and render the component natively in your JSX/TSX layout:',
              })}
            </p>
            <div className="mt-2 bg-gray-100/80 dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 flex items-center justify-between group">
              <code className="text-emerald-600 dark:text-emerald-300 font-mono select-all">
                {`<CommitPulse username="${username || 'your-github-username'}" theme="dark" />`}
              </code>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `<CommitPulse username="${username || 'your-github-username'}" theme="dark" />`
                  );
                }}
                className="text-gray-400 hover:text-emerald-500 transition-colors"
                title="Copy usage snippet"
                aria-label="Copy component usage snippet"
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
            {t('customize.export.default_footer_prefix', {
              defaultValue: "Paste this into your GitHub profile's ",
            })}
            <code className="text-gray-700 dark:text-white/75">README.md</code>.{' '}
            {t('customize.export.footer_tip')}
          </p>
        )}
      </div>
    </div>
  );
}
