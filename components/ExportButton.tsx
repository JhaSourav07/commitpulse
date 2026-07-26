'use client';

import { useState } from 'react';
import { useExportImage, ExportFormat } from '@/hooks/useExportImage';

interface ExportButtonProps {
  targetSelector?: string;
  filename?: string;
  scale?: number;
  className?: string;
}

export default function ExportButton({
  targetSelector = '[data-export-target]',
  filename = 'commitpulse-comparison',
  scale = 2,
  className = '',
}: ExportButtonProps) {
  const { exportImage, isExporting, error } = useExportImage({
    targetSelector,
    filename,
    scale,
  });

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleExport = async (format: ExportFormat) => {
    setDropdownOpen(false);
    await exportImage(format);
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        onClick={() => setDropdownOpen((v) => !v)}
        disabled={isExporting}
        aria-haspopup="true"
        aria-expanded={dropdownOpen}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 border-black/20 bg-black text-white hover:bg-black/80 text-sm font-medium text-white transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        {isExporting ? (
          <>
            <svg
              className="animate-spin h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
              />
            </svg>
            Exporting…
          </>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"
              />
            </svg>
            Export
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-3 w-3 transition-transform duration-150 ${dropdownOpen ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </>
        )}
      </button>

      {dropdownOpen && !isExporting && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
          <ul
            role="menu"
            className="absolute right-0 z-20 mt-1 w-40 rounded-lg border border-white/10 bg-[#0d1117] shadow-xl overflow-hidden"
          >
            <li role="none">
              <button
                role="menuitem"
                onClick={() => handleExport('png')}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left text-white/80 hover:text-white hover:bg-white/10 transition-colors duration-100"
              >
                Download PNG
              </button>
            </li>
            <li role="none">
              <button
                role="menuitem"
                onClick={() => handleExport('pdf')}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left text-white/80 hover:text-white hover:bg-white/10 transition-colors duration-100"
              >
                Download PDF
              </button>
            </li>
            <li role="none">
              <button
                role="menuitem"
                onClick={() => handleExport('svg')}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left text-white/80 hover:text-white hover:bg-white/10 transition-colors duration-100"
              >
                Download SVG
              </button>
            </li>
          </ul>
        </>
      )}

      {error && (
        <p
          role="alert"
          className="absolute top-full mt-2 right-0 z-30 w-64 p-2 rounded-lg bg-red-950/80 border border-red-500/30 text-xs text-red-300"
        >
          {error}
        </p>
      )}
    </div>
  );
}
