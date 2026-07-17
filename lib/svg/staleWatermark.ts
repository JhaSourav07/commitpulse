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

export function hasStaleWatermark(svg: string): boolean {
  return svg.includes('commitpulse-stale-badge');
}
