/**
 * Lightweight, hand-built illustrative previews of the Snake and Pacman
 * contribution graphs. These are NOT live data — they exist purely so the
 * "Live Preview" panel in the generator always shows something visual,
 * giving the user a sense of what the animation looks like before they've
 * set up the GitHub Action that produces their real graph.
 *
 * Encoded as data URIs so they render via a plain <img src> with zero extra
 * network requests, no external hosting, and no client-side SVG-in-JSX
 * hydration cost.
 */

const GITHUB_GREENS = ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'];

/** Deterministic pseudo-random contribution intensity, 0-4, seeded by (col, row). */
function sampleIntensity(col: number, row: number): number {
  const seed = Math.sin(col * 12.9898 + row * 78.233) * 43758.5453;
  const frac = seed - Math.floor(seed);
  return Math.floor(frac * 5);
}

function buildContributionGrid(cols: number, rows: number, cellSize: number, gap: number) {
  let rects = '';
  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows; row++) {
      const intensity = sampleIntensity(col, row);
      const x = col * (cellSize + gap);
      const y = row * (cellSize + gap);
      rects += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="2" fill="${GITHUB_GREENS[intensity]}" />`;
    }
  }
  return rects;
}

const COLS = 26;
const ROWS = 7;
const CELL = 11;
const GAP = 3;
const GRID_WIDTH = COLS * (CELL + GAP) - GAP;
const GRID_HEIGHT = ROWS * (CELL + GAP) - GAP;

function buildSnakeSampleSvg(): string {
  const grid = buildContributionGrid(COLS, ROWS, CELL, GAP);

  // A short illustrative "snake" path weaving through a few cells, just to
  // suggest the animation — not meant to trace any real route.
  const snakeCells = [
    [2, 3],
    [3, 3],
    [4, 3],
    [4, 2],
    [5, 2],
    [6, 2],
    [6, 3],
    [7, 3],
  ];
  const snakeRects = snakeCells
    .map(([col, row], i) => {
      const x = col * (CELL + GAP);
      const y = row * (CELL + GAP);
      const isHead = i === snakeCells.length - 1;
      return `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2" fill="${isHead ? '#ffffff' : '#3fba50'}" stroke="#0d1117" stroke-width="0.5" />`;
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${GRID_WIDTH} ${GRID_HEIGHT}" width="${GRID_WIDTH}" height="${GRID_HEIGHT}">
    <rect width="${GRID_WIDTH}" height="${GRID_HEIGHT}" fill="#0d1117" />
    ${grid}
    ${snakeRects}
  </svg>`;
}

function buildPacmanSampleSvg(): string {
  const grid = buildContributionGrid(COLS, ROWS, CELL, GAP);
  const pacmanCol = 5;
  const pacmanRow = 3;
  const pacX = pacmanCol * (CELL + GAP) + CELL / 2;
  const pacY = pacmanRow * (CELL + GAP) + CELL / 2;
  const pacR = CELL * 0.85;

  // Pac-Man "mouth" wedge, roughly 60 degrees open, facing right.
  const mouthPath = `M ${pacX} ${pacY} L ${pacX + pacR} ${pacY - pacR * 0.55} A ${pacR} ${pacR} 0 1 1 ${pacX + pacR} ${pacY + pacR * 0.55} Z`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${GRID_WIDTH} ${GRID_HEIGHT}" width="${GRID_WIDTH}" height="${GRID_HEIGHT}">
    <rect width="${GRID_WIDTH}" height="${GRID_HEIGHT}" fill="#0d1117" />
    ${grid}
    <path d="${mouthPath}" fill="#ffe35a" />
    <circle cx="${pacX - pacR * 0.15}" cy="${pacY - pacR * 0.55}" r="1.1" fill="#0d1117" />
  </svg>`;
}

function toDataUri(svg: string): string {
  const encoded = encodeURIComponent(svg).replace(/'/g, '%27').replace(/"/g, '%22');
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}

export const SNAKE_SAMPLE_PREVIEW_SRC = toDataUri(buildSnakeSampleSvg());
export const PACMAN_SAMPLE_PREVIEW_SRC = toDataUri(buildPacmanSampleSvg());
