'use client';

import { copyToClipboard as clipboardCopy } from '@/utils/clipboard';
import { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';

type CodeBlockProps = {
  code: string;
};

export function CodeBlock({ code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const copyToClipboard = async () => {
    try {
      await clipboardCopy(code);
      setCopied(true);
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={copyToClipboard}
        className="absolute right-3 top-3 inline-flex items-center gap-2 rounded-full border border-black/10 bg-gray-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-gray-700 transition hover:border-black/20 hover:text-black dark:border-white/10 dark:bg-black/70 dark:text-white/65 dark:hover:border-white/20 dark:hover:text-white"
        aria-label={copied ? 'Copied snippet' : 'Copy code snippet'}
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-emerald-300" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
        {copied ? 'Copied' : 'Copy'}
      </button>
      <pre className="overflow-x-auto rounded-[1.5rem] border border-black/10 bg-gray-100 p-4 pr-24 text-sm leading-7 text-emerald-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] dark:border-white/8 dark:bg-[#030303] dark:text-emerald-300">
        <code>{code}</code>
      </pre>
    </div>
  );
}
