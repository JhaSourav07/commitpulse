/**
 * Injects a "cached" watermark badge into an SVG string.
 *
 * Appends a `<g class="commitpulse-stale-badge">` group just before the closing
 * `</svg>` tag. If the input is not valid SVG (no `</svg>` tag), returns it unchanged.
 *
 * @param svg - Raw SVG markup string
 * @returns SVG markup with the stale watermark injected before `</svg>`
 */
export function injectStaleWatermark(svg: string): string {
  const watermark = `
  <g class="commitpulse-stale-badge" aria-label="Cached data">
    <rect x="calc(100% - 110)" y="calc(100% - 24)" width="104" height="18" rx="4"
      fill="#f59e0b" fill-opacity="0.15" stroke="#f59e0b" stroke-width="0.75" stroke-opacity="0.6"/>
    <text x="calc(100% - 58)" y="calc(100% - 11)" font-family="monospace" font-size="9"
      fill="#f59e0b" fill-opacity="0.9" text-anchor="middle" dominant-baseline="middle">
      ? cached
    </text>
  </g>`;
  if (!svg.includes('</svg>')) return svg;
  return svg.replace('</svg>', `${watermark}\n</svg>`);
}

/**
 * Checks whether an SVG string already contains the stale watermark badge.
 *
 * @param svg - Raw SVG markup string
 * @returns `true` if the SVG contains `commitpulse-stale-badge`, `false` otherwise
 */
export function hasStaleWatermark(svg: string): boolean {
  return svg.includes('commitpulse-stale-badge');
}
