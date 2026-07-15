'use client';

import { fallbackCopyToClipboard } from '@/utils/clipboard';
import { useState, useCallback } from 'react';
import { Copy, Check, Eye, Code2, Download } from 'lucide-react';

interface PreviewPanelProps {
  markdown: string;
  hasContent?: boolean;
}

function renderPreview(md: string): string {
  const html = md
    .replace(/^(#{1,6})\s+(.+)$/gm, (_, hashes: string, text: string) => {
      const level = hashes.length;
      const sizes: Record<number, string> = {
        1: 'text-2xl font-bold',
        2: 'text-xl font-semibold',
        3: 'text-lg font-medium',
      };
      const cls = sizes[level] ?? 'text-base font-medium';
      return `<h${level} class="${cls} text-gray-900 dark:text-white my-2">${text}</h${level}>`;
    })
    .replace(/^---$/gm, '<hr class="border-gray-200 dark:border-white/10 my-3" />')
    .replace(
      /\[!\[([^\]]*)\]\(([^)]+)\)\]\(([^)]+)\)/g,
      (_: string, alt: string, src: string, href: string) =>
        `<a href="${href}" target="_blank" rel="noopener noreferrer"><img src="${src}" alt="${alt}" class="max-w-full h-auto rounded" /></a>`
    )
    .replace(/\n&nbsp;\n/g, '<span class="inline-block w-2"></span>');

  return html;
}

export function PreviewPanel({ markdown }: PreviewPanelProps) {
  const [tab, setTab] = useState<'preview' | 'raw'>('preview');
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(markdown);
        } catch {
          const copiedSuccessfully = fallbackCopyToClipboard(markdown);

          if (!copiedSuccessfully) {
            throw new Error('Clipboard copy failed');
          }
        }
      } else {
        const copiedSuccessfully = fallbackCopyToClipboard(markdown);

        if (!copiedSuccessfully) {
          throw new Error('Clipboard copy failed');
        }
      }

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [markdown]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'README.md';
    a.click();
    URL.revokeObjectURL(url);
  }, [markdown]);

  const previewHtml = renderPreview(markdown);

  return (
    <div className="flex flex-col h-full rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111111] overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-white/8">
        <div
          role="tablist"
          aria-label="View mode selection"
          className="flex rounded-xl bg-gray-100 dark:bg-white/5 p-1 gap-1"
        >
          <button
            type="button"
            role="tab"
            id="tab-preview"
            aria-selected={tab === 'preview'}
            aria-controls="panel-preview"
            onClick={() => setTab('preview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#111111] ${
              tab === 'preview'
                ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/60'
            }`}
          >
            <Eye size={12} />
            Preview
          </button>
          <button
            type="button"
            role="tab"
            id="tab-raw"
            aria-selected={tab === 'raw'}
            aria-controls="panel-raw"
            onClick={() => setTab('raw')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#111111] ${
              tab === 'raw'
                ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/60'
            }`}
          >
            <Code2 size={12} />
            Markdown
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownload}
            title="Download README.md"
            aria-label="Download README.md"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-xs font-medium text-gray-600 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#111111]"
          >
            <Download size={12} />
            <span className="hidden sm:inline">Download</span>
          </button>
          <button
            type="button"
            onClick={handleCopy}
            aria-label={
              copied ? 'Copied markdown text to clipboard' : 'Copy markdown text to clipboard'
            }
            aria-live="polite"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#111111] ${
              copied
                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                : 'bg-emerald-500 hover:bg-emerald-400 text-white border border-emerald-500'
            }`}
          >
            - {copied ? 'Copied!' : 'Copy'}+ {copied ? 'Copied!' : 'Copy Markdown'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {tab === 'preview' ? (
          <div
            id="panel-preview"
            role="tabpanel"
            aria-labelledby="tab-preview"
            className="p-6 min-h-full"
          >
            <div className="rounded-xl border border-gray-200 dark:border-white/8 bg-white dark:bg-[#0d1117] p-6 min-h-[200px]">
              <div
                className="readme-preview text-gray-800 dark:text-[#e6edf3] text-sm leading-relaxed wrap-break-word"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          </div>
        ) : (
          <div id="panel-raw" role="tabpanel" aria-labelledby="tab-raw" className="relative h-full">
            <pre
              className="p-5 text-xs font-mono leading-relaxed text-gray-700 dark:text-white/70 whitespace-pre-wrap overflow-auto h-full select-all"
              style={{
                overflowWrap: 'anywhere',
                wordBreak: 'break-word',
              }}
            >
              {markdown}
            </pre>
          </div>
        )}
      </div>

      <div className="px-5 py-2.5 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
        <span className="text-[10px] text-gray-400 dark:text-white/25">
          {markdown.split('\n').length} lines · {markdown.length} chars
        </span>
        <span className="text-[10px] text-emerald-500 dark:text-emerald-400 font-medium">
          README.md
        </span>
      </div>

      <style>{`
        .readme-preview img { display: inline-block; vertical-align: middle; }
        .readme-preview div[align="center"],
        .readme-preview [align="center"] { text-align: center; }
        .readme-preview p { margin: 0.5rem 0; }
        .readme-preview h1, .readme-preview h2, .readme-preview h3 { margin: 0.75rem 0 0.25rem; }
        .readme-preview hr { margin: 1rem 0; border-color: rgba(255,255,255,0.08); }
        .readme-preview a img { border-radius: 6px; }
        .readme-preview { overflow-wrap: anywhere; word-break: break-word; }
      `}</style>
    </div>
  );
}
