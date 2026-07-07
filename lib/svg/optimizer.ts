/**
 * Custom lightweight SVG minifier / optimizer that runs on Vercel Edge Runtime.
 *
 * Removes redundant whitespace and line breaks outside text, desc, title, and style segments.
 * Removes unnecessary XML/HTML comments.
 * Shortens path commands and floats where possible.
 * Minifies CSS styles inside <style> blocks.
 */

/**
 * Optimizes path data string (value of the 'd' attribute).
 */
export function optimizePathData(d: string): string {
  // 1. Remove commas and replace them with spaces
  let optimized = d.replace(/,/g, ' ');

  // 2. Normalize multiple spaces to a single space
  optimized = optimized.replace(/\s+/g, ' ');

  // 3. Remove spaces around path command letters
  optimized = optimized.replace(/\s*([mlhvcstaz])\s*/gi, '$1');

  // 4. Remove leading/trailing whitespace
  optimized = optimized.trim();

  // 5. Shorten floats in path data
  optimized = optimized.replace(/[-+]?\d+\.\d+/g, (m) => {
    const val = parseFloat(m);
    let s = val.toFixed(2);
    if (s.indexOf('.') !== -1) {
      s = s.replace(/0+$/, '');
      s = s.replace(/\.$/, '');
    }
    // Remove leading zero: 0.5 -> .5, -0.5 -> -.5
    s = s.replace(/^(-?)0\./, '$1.');
    return s;
  });

  // 6. Remove spaces before negative numbers
  optimized = optimized.replace(/\s+(?=-)/g, '');

  return optimized;
}

/**
 * Safely minifies CSS content inside <style> blocks.
 */
export function minifyCSS(css: string): string {
  // Remove CSS comments
  let min = css.replace(/\/\*[\s\S]*?\*\//g, '');
  // Normalize whitespace to single space
  min = min.replace(/\s+/g, ' ');
  // Remove space around curly braces and semicolons
  min = min.replace(/\s*([{};])\s*/g, '$1');
  return min.trim();
}

/**
 * Helper to safely strip HTML/XML comments from SVG string without using regex
 * to satisfy CodeQL's security checks.
 */
export function stripComments(html: string): string {
  let result = '';
  let i = 0;
  while (i < html.length) {
    if (html.slice(i, i + 4) === '<!--') {
      const endIdx = html.indexOf('-->', i + 4);
      if (endIdx !== -1) {
        i = endIdx + 3;
        continue;
      }
    }
    result += html[i];
    i++;
  }
  return result;
}

/**
 * Optimizes the SVG markup.
 */
export function optimizeSVG(svg: string): string {
  if (!svg) return '';

  const styleBlocks: string[] = [];
  const textBlocks: string[] = [];
  const placeholderPrefix = `cp-placeholder-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

  // 1. Isolate style blocks using tag-based placeholders
  let processed = svg.replace(/<style([^>]*)>([\s\S]*?)<\/style>/gi, (match, attrs, content) => {
    const minifiedCss = minifyCSS(content);
    styleBlocks.push(`<style${attrs}>${minifiedCss}</style>`);
    return `<${placeholderPrefix}-style-${styleBlocks.length - 1}/>`;
  });

  // 2. Isolate text blocks (text, desc, title) using tag-based placeholders
  processed = processed.replace(
    /<(text|desc|title)([^>]*)>([\s\S]*?)<\/\1>/gi,
    (match, tag, attrs, content) => {
      textBlocks.push(`<${tag}${attrs}>${content}</${tag}>`);
      return `<${placeholderPrefix}-text-${textBlocks.length - 1}/>`;
    }
  );

  // 3. Process non-isolated SVG markup
  // Remove XML/HTML comments safely
  processed = stripComments(processed);

  // Round floats with more than 2 decimal places to at most 2 decimal places
  processed = processed.replace(/[-+]?\d+\.\d{3,}\b/g, (m) => {
    const val = parseFloat(m);
    let s = val.toFixed(2);
    if (s.indexOf('.') !== -1) {
      s = s.replace(/0+$/, '');
      s = s.replace(/\.$/, '');
    }
    // Remove leading zero: 0.5 -> .5, -0.5 -> -.5
    s = s.replace(/^(-?)0\./, '$1.');
    return s;
  });

  // Optimize path data attributes d="..." and d='...'
  processed = processed.replace(/d="([^"]+)"/g, (match, p1) => `d="${optimizePathData(p1)}"`);
  processed = processed.replace(/d='([^']+)'/g, (match, p1) => `d='${optimizePathData(p1)}'`);

  // Compress redundant whitespace to single space
  processed = processed.replace(/\s+/g, ' ');

  // Remove whitespace between tags
  processed = processed.replace(/>\s+</g, '><');

  // Remove whitespace before closing elements
  processed = processed.replace(/\s*(?=\/>|>)/g, '');

  // Remove whitespace after tag start
  processed = processed.replace(/<\s+/g, '<');

  // 4. Re-inject style blocks
  styleBlocks.forEach((block, index) => {
    const placeholder = `<${placeholderPrefix}-style-${index}/>`;
    processed = processed.replace(placeholder, block);
  });

  // 5. Re-inject text blocks
  textBlocks.forEach((block, index) => {
    const placeholder = `<${placeholderPrefix}-text-${index}/>`;
    processed = processed.replace(placeholder, block);
  });

  return processed.trim();
}
