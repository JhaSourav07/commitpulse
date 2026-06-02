'use client';

import { useState } from 'react';
import { Copy } from 'lucide-react';

export default function CopyRepoButton() {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');

  const repoUrl = 'https://github.com/JhaSourav07/commitpulse';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(repoUrl);
      setCopyState('copied');
    } catch {
      setCopyState('error');
    }

    setTimeout(() => setCopyState('idle'), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white/60 px-8 py-4 font-semibold transition-all duration-300 hover:scale-105 dark:border-white/10 dark:bg-white/5"
    >
      <Copy className="h-5 w-5" />
      {copyState === 'copied' ? 'Copied!' : copyState === 'error' ? 'Copy failed' : 'Copy URL'}
    </button>
  );
}
