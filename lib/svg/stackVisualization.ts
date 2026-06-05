/**
 * SVG Rendering utilities for tech stack-aware visualization
 *
 * Provides functions to integrate stack analytics into the isometric SVG rendering.
 */

import type { StackAnalytics } from '@/types';

/**
 * Determines the tower color based on stack analytics
 *
 * For MVP: uses dominant stack color for all towers
 * Future: could use date-based stack tracking for dynamic coloring
 */
export function getStackTowerColor(analytics: StackAnalytics): string {
  // For MVP, all towers use the dominant stack's color
  return analytics.dominantStackColor;
}

/**
 * Generates an SVG legend showing top technologies and their contribution percentages
 */
export function renderStackLegend(
  analytics: StackAnalytics,
  x: number,
  y: number,
  maxItems: number = 5,
  fontSize: number = 12,
  textColor: string = '#ffffff'
): string {
  const items = analytics.topStacks.slice(0, maxItems);
  let legend = `<g class="stack-legend" transform="translate(${x}, ${y})">`;

  // Background box
  const boxHeight = items.length * (fontSize + 4) + 8;
  const maxLabelWidth = Math.max(...items.map((s) => s.language.length)) * (fontSize * 0.6) + 40;

  legend += `
    <rect 
      x="0" y="0" 
      width="${maxLabelWidth}" 
      height="${boxHeight}" 
      fill="#0d1117" 
      fill-opacity="0.8" 
      rx="4" 
      stroke="${textColor}" 
      stroke-opacity="0.2"
    />
  `;

  // Legend title
  legend += `
    <text 
      x="8" y="16" 
      font-size="${fontSize}" 
      font-weight="bold" 
      fill="${textColor}" 
      fill-opacity="0.9"
    >
      Tech Stack
    </text>
  `;

  // Legend items
  items.forEach((stat, index) => {
    const yOffset = 28 + index * (fontSize + 4);
    const colorBoxSize = fontSize - 2;

    legend += `
      <rect 
        x="8" y="${yOffset - colorBoxSize + 2}" 
        width="${colorBoxSize}" 
        height="${colorBoxSize}" 
        fill="${stat.color}" 
        fill-opacity="0.8"
        rx="2"
      />
      <text 
        x="${20}" y="${yOffset + 4}" 
        font-size="${fontSize - 2}" 
        fill="${textColor}" 
        fill-opacity="0.7"
      >
        ${stat.language} (${stat.percentage.toFixed(0)}%)
      </text>
    `;
  });

  legend += `</g>`;
  return legend;
}

/**
 * Validates if stack analytics should be rendered in the visualization
 */
export function shouldRenderStackVisualization(analytics: StackAnalytics | null): boolean {
  return (
    analytics !== null &&
    analytics.topStacks.length > 0 &&
    analytics.dominantStack !== 'Other' &&
    analytics.totalContributions > 0
  );
}

/**
 * Generates CSS for stack-colored tower styling
 */
export function getStackColorCSS(analytics: StackAnalytics): string {
  let css = '';

  // Create CSS classes for each language/stack
  for (const stat of analytics.topStacks.slice(0, 10)) {
    const className = `stack-${sanitizeClassName(stat.language)}`;
    css += `.${className} { --stack-color: ${stat.color}; }\n`;
  }

  // Class for dominant stack
  const dominantClassName = `stack-${sanitizeClassName(analytics.dominantStack)}`;
  css += `.${dominantClassName} { fill: ${analytics.dominantStackColor}; }\n`;

  return css;
}

/**
 * Sanitizes a string to be a valid CSS class name
 */
function sanitizeClassName(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}
