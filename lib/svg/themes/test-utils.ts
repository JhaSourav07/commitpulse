export function hexToRgb(hex: string) {
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
  };
}

export function relativeLuminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const [rl, gl, bl] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

export function contrastRatio(bg: string, text: string) {
  const lBg = relativeLuminance(bg);
  const lText = relativeLuminance(text);
  const lighter = Math.max(lBg, lText);
  const darker = Math.min(lBg, lText);
  return (lighter + 0.05) / (darker + 0.05);
}
