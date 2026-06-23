import { useCallback, useState } from 'react';

export type ExportFormat = 'png' | 'svg';

interface UseExportImageOptions {
  targetSelector?: string;
  filename?: string;
  scale?: number;
}

interface UseExportImageReturn {
  exportImage: (format: ExportFormat) => Promise<void>;
  isExporting: boolean;
  error: string | null;
}

export function useExportImage({
  targetSelector = '[data-export-target]',
  filename = 'commitpulse-comparison',
  scale = 2,
}: UseExportImageOptions = {}): UseExportImageReturn {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportImage = useCallback(
    async (format: ExportFormat) => {
      setIsExporting(true);
      setError(null);

      try {
        const target = document.querySelector<HTMLElement>(targetSelector);
        if (!target) {
          throw new Error(
            `Export target not found. Add data-export-target attribute to the comparison card.`
          );
        }

        if (format === 'png') {
          await exportAsPng(target, filename, scale);
        } else {
          await exportAsSvg(target, filename);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Export failed. Please try again.';
        setError(message);
        console.error('[useExportImage]', err);
      } finally {
        setIsExporting(false);
      }
    },
    [targetSelector, filename, scale]
  );

  return { exportImage, isExporting, error };
}

async function scrollAndWait(): Promise<void> {
  window.scrollTo(0, document.body.scrollHeight);
  await new Promise((r) => setTimeout(r, 800));
  window.scrollTo(0, 0);
  await new Promise((r) => setTimeout(r, 300));
}

async function exportAsPng(element: HTMLElement, filename: string, scale: number): Promise<void> {
  const { toPng } = await import('html-to-image');
  await scrollAndWait();
  const dataUrl = await toPng(element, {
    pixelRatio: scale,
    backgroundColor: '#ffffff',
  });
  triggerDownload(dataUrl, `${filename}.png`);
}

async function exportAsSvg(element: HTMLElement, filename: string): Promise<void> {
  const { toSvg } = await import('html-to-image');
  await scrollAndWait();
  const dataUrl = await toSvg(element, {
    backgroundColor: '#ffffff',
  });
  triggerDownload(dataUrl, `${filename}.svg`);
}

function triggerDownload(href: string, filename: string): void {
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  if (href.startsWith('blob:')) {
    setTimeout(() => URL.revokeObjectURL(href), 10_000);
  }
}
