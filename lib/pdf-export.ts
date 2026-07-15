export type PdfLike = {
  internal: {
    pageSize: {
      getWidth: () => number;
      getHeight: () => number;
    };
  };
  addImage: (
    imageData: string,
    format: string,
    x: number,
    y: number,
    width: number,
    height: number
  ) => void;
  save: (filename: string) => void;
  svg?: (
    element: Element,
    options?: { x?: number; y?: number; width?: number; height?: number }
  ) => Promise<PdfLike>;
};

const SVG_WIDTH = 600;
const SVG_HEIGHT = 420;

// Default dark theme colors — matches AUTO_THEME_DARK / 'dark' theme used by the default badge
const DEFAULT_BG = '#0d1117';
const DEFAULT_TEXT = '#c9d1d9';
const DEFAULT_ACCENT = '#58a6ff';

function createSvgDataUrl(svgMarkup: string): string {
  const encoded = encodeURIComponent(svgMarkup);
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}

function parseSvgDimension(value: string | null): number | null {
  if (!value) return null;

  const trimmed = value.trim();

  if (trimmed.endsWith('%')) {
    return null;
  }

  const pxStripped = trimmed.replace(/px$/i, '');
  const n = Number(pxStripped);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function parseSvgViewBox(svgElement: SVGElement): { width: number; height: number } | null {
  const viewBox = svgElement.getAttribute('viewBox');
  if (!viewBox) return null;

  const parts = viewBox
    .trim()
    .split(/[,\s]+/)
    .map((p) => Number(p));

  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) return null;

  const [, , w, h] = parts;
  return w > 0 && h > 0 ? { width: w, height: h } : null;
}

/**
 * Extracts the theme colors (:root CSS variables) from the SVG's <style> block.
 * Prefers the dark-mode values since PDF is rendered in a neutral context.
 * Falls back to DEFAULT_* constants if parsing fails.
 */
function extractThemeColors(svgMarkup: string): { bg: string; text: string; accent: string } {
  // Try to find @media dark block first
  const darkMediaMatch = svgMarkup.match(
    /@media\s*\(\s*prefers-color-scheme\s*:\s*dark\s*\)[^{]*\{[^{]*:root\s*\{([^}]*)\}/
  );
  if (darkMediaMatch) {
    const vars = darkMediaMatch[1];
    const bg = vars.match(/--cp-bg\s*:\s*(#[0-9a-fA-F]{3,8})/)?.[1];
    const text = vars.match(/--cp-text\s*:\s*(#[0-9a-fA-F]{3,8})/)?.[1];
    const accent = vars.match(/--cp-accent\s*:\s*(#[0-9a-fA-F]{3,8})/)?.[1];
    if (bg && text && accent) {
      return { bg, text, accent };
    }
  }

  // Fallback: try :root block (light theme or no-media-query)
  const rootMatch = svgMarkup.match(/:root\s*\{([^}]*)\}/);
  if (rootMatch) {
    const vars = rootMatch[1];
    const bg = vars.match(/--cp-bg\s*:\s*(#[0-9a-fA-F]{3,8})/)?.[1];
    const text = vars.match(/--cp-text\s*:\s*(#[0-9a-fA-F]{3,8})/)?.[1];
    const accent = vars.match(/--cp-accent\s*:\s*(#[0-9a-fA-F]{3,8})/)?.[1];
    if (bg && text && accent) {
      return { bg, text, accent };
    }
  }

  return { bg: DEFAULT_BG, text: DEFAULT_TEXT, accent: DEFAULT_ACCENT };
}

/**
 * Inlines all CSS variable references and class-based fills in the SVG markup so it
 * renders correctly when painted onto an HTML Canvas (which ignores stylesheets and
 * CSS custom properties for externally-loaded SVGs).
 *
 * Strategy:
 * 1. Extract the actual theme colors from the SVG's own <style> block.
 * 2. Replace every class="cp-*-fill" with an explicit fill="…" attribute.
 * 3. Replace every var(--cp-*) occurrence in attribute values.
 * 4. Strip the <style> block's @media query so the remaining :root vars don't
 *    accidentally override our inline replacements in some renderers.
 */
function resolveForCanvas(svgMarkup: string): string {
  const { bg, text, accent } = extractThemeColors(svgMarkup);

  let out = svgMarkup;

  // ── 1. Class-based fill attributes ─────────────────────────────────────────
  // Replace class="cp-bg-fill" → fill="#…" (keep any other classes present too)
  out = out.replace(/\bclass="([^"]*\bcp-bg-fill\b[^"]*)"/g, (_match, cls) => {
    const remaining = cls.replace(/\bcp-bg-fill\b/g, '').trim();
    return remaining ? `fill="${bg}" class="${remaining}"` : `fill="${bg}"`;
  });

  out = out.replace(/\bclass="([^"]*\bcp-text-fill\b[^"]*)"/g, (_match, cls) => {
    const remaining = cls.replace(/\bcp-text-fill\b/g, '').trim();
    return remaining ? `fill="${text}" class="${remaining}"` : `fill="${text}"`;
  });

  out = out.replace(/\bclass="([^"]*\bcp-accent-fill\b[^"]*)"/g, (_match, cls) => {
    const remaining = cls.replace(/\bcp-accent-fill\b/g, '').trim();
    return remaining ? `fill="${accent}" class="${remaining}"` : `fill="${accent}"`;
  });

  // ── 2. var(--cp-*) in attribute values ─────────────────────────────────────
  out = out.replace(/var\(--cp-bg\)/g, bg);
  out = out.replace(/var\(--cp-text\)/g, text);
  out = out.replace(/var\(--cp-accent\)/g, accent);
  out = out.replace(/var\(--cp-label-fill\)/g, text);
  out = out.replace(/var\(--cp-label-opacity\)/g, '0.7');
  out = out.replace(/var\(--cp-negative(?:,[^)]+)?\)/g, '#f85149');

  // ── 3. var(--cp-*) inside the <style> block itself ─────────────────────────
  const styleMatch = out.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  if (styleMatch) {
    let styleContent = styleMatch[1];
    styleContent = styleContent.replace(/var\(--cp-bg\)/g, bg);
    styleContent = styleContent.replace(/var\(--cp-text\)/g, text);
    styleContent = styleContent.replace(/var\(--cp-accent\)/g, accent);
    styleContent = styleContent.replace(/var\(--cp-label-fill\)/g, text);
    styleContent = styleContent.replace(/var\(--cp-label-opacity\)/g, '0.7');
    styleContent = styleContent.replace(/var\(--cp-negative(?:,[^)]+)?\)/g, '#f85149');
    // Remove @media prefers-color-scheme block (no longer needed — vars are inlined)
    styleContent = styleContent.replace(
      /@media\s*\([^)]*prefers-color-scheme[^)]*\)\s*\{[^}]*\{[^}]*\}\s*\}/g,
      ''
    );
    // Add explicit class rules with inlined colors in case the class regex missed anything
    styleContent += `\n  .cp-bg-fill { fill: ${bg}; }\n  .cp-text-fill { fill: ${text}; color: ${text}; }\n  .cp-accent-fill { fill: ${accent}; color: ${accent}; }\n`;

    // Disable all animations for Canvas capture. Canvas captures the first frame instantly,
    // so starting styles like scaleY(0) or opacity:0 would make elements invisible.
    styleContent += `
  .cp-tower { animation: none !important; transform: scaleY(1) translateY(0) !important; opacity: 1 !important; }
  .scan-line { animation: none !important; transform: none !important; }
  .interactive-tower { transition: none !important; transform: none !important; opacity: 1 !important; }
`;

    out = out.replace(/<style[^>]*>[\s\S]*?<\/style>/i, `<style>${styleContent}</style>`);
  }

  return out;
}

export async function exportSvgToPdf(
  svgMarkup: string,
  fileName: string,
  pdf: PdfLike
): Promise<void> {
  // Always resolve CSS variables/classes — even non-autoTheme SVGs use them
  const processedSvg = resolveForCanvas(svgMarkup);

  const parser = new DOMParser();
  const doc = parser.parseFromString(processedSvg, 'image/svg+xml');
  const svgElement = doc.querySelector('svg');

  if (!svgElement) {
    throw new Error('SVG element not found');
  }

  const svgWidth = parseSvgDimension(svgElement.getAttribute('width'));
  const svgHeight = parseSvgDimension(svgElement.getAttribute('height'));

  const viewBoxDims = parseSvgViewBox(svgElement);

  const width = svgWidth ?? viewBoxDims?.width ?? SVG_WIDTH;
  const height = svgHeight ?? viewBoxDims?.height ?? SVG_HEIGHT;

  if (width <= 0 || height <= 0) {
    throw new Error(`Invalid SVG dimensions for PDF export: width=${width}, height=${height}`);
  }

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const scale = Math.min((pageWidth - 40) / width, (pageHeight - 40) / height);
  const renderWidth = width * scale;
  const renderHeight = height * scale;

  // Ensure the SVG element has explicit width/height attributes for proper rendering
  svgElement.setAttribute('width', String(width));
  svgElement.setAttribute('height', String(height));

  const svgString = new XMLSerializer().serializeToString(svgElement);

  // Use canvas approach: browser renders SVG natively (with all filters, gradients)
  // then we snapshot it to PNG before inserting into the PDF.
  const dataUrl = createSvgDataUrl(svgString);
  const image = new Image();

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = (e) => reject(new Error(`Failed to load SVG image for PDF export: ${e}`));
    image.src = dataUrl;

    setTimeout(() => {
      if (!image.complete) {
        reject(new Error('SVG image load timeout for PDF export'));
      }
    }, 5000);
  });

  // Use 2x pixel density for a sharper PDF
  const dpr = 2;
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(renderWidth * dpr);
  canvas.height = Math.ceil(renderHeight * dpr);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Failed to create canvas for PDF export');
  }

  // Fill the SVG background color explicitly (in case SVG bg rect is transparent)
  const { bg } = extractThemeColors(svgMarkup);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  const pngDataUrl = canvas.toDataURL('image/png');

  pdf.addImage(pngDataUrl, 'PNG', 20, 20, renderWidth, renderHeight);

  pdf.save(fileName);
}
