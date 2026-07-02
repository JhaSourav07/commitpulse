export interface ContributionNode {
  date: string;
  count: number; // The number of contributions on this day
  x: number; // Grid X coordinate (0 to 6)
  y: number; // Grid Y coordinate (usually 0 to 52 for weeks)
}

/**
 * Generates an optimized, low-payload 3D isometric contribution graph SVG.
 */
export function generateOptimizedSvg(contributionData: ContributionNode[]): string {
  // Dimensions for standard isometric building block projections
  const tileWidth = 16;
  const tileHeight = 8;
  const blockHeightUnit = 4; // Height pixels added per contribution point

  // ==========================================
  // STEP 1: THE GRID MAP MATRIX SYSTEM
  // ==========================================
  const safeData = (Array.isArray(contributionData) ? contributionData : []).filter(
    (node) => node && typeof node === 'object'
  );

  // ==========================================
  // STEP 2: THE GRID MAP DICTIONARY SETUP
  // ==========================================
  const gridMap: Record<string, number> = {};
  for (let i = 0; i < safeData.length; i++) {
    const node = safeData[i];
    const x = typeof node.x === 'number' ? node.x : 0;
    const y = typeof node.y === 'number' ? node.y : 0;
    const count = typeof node.count === 'number' ? node.count : 0;
    gridMap[`${x},${y}`] = count;
  }

  // ==========================================
  // STEP 3: DEFINE THE MASTER BLUEPRINTS (<defs>)
  // ==========================================
  const svgDefs = `
  <defs>
    <polygon id="iso-top" points="0,0 ${tileWidth / 2},-${tileHeight / 2} ${tileWidth},0 ${tileWidth / 2},${tileHeight / 2}" />
    
    <polygon id="iso-left-unit" points="0,0 ${tileWidth / 2},${tileHeight / 2} ${tileWidth / 2},${tileHeight / 2 + 1} 0,1" />
    
    <polygon id="iso-right-unit" points="${tileWidth / 2},${tileHeight / 2} ${tileWidth},0 ${tileWidth},1 ${tileWidth / 2},${tileHeight / 2 + 1}" />
    
    <linearGradient id="left-shading" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#22c55e" />
      <stop offset="100%" stop-color="#15803d" />
    </linearGradient>
    <linearGradient id="right-shading" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#16a34a" />
      <stop offset="100%" stop-color="#166534" />
    </linearGradient>
  </defs>
  `;

  // Sort back-to-front based on spatial layout depth (Painter's Algorithm)
  const sortedData = [...safeData].sort((a, b) => {
    const ax = typeof a.x === 'number' ? a.x : 0;
    const ay = typeof a.y === 'number' ? a.y : 0;
    const bx = typeof b.x === 'number' ? b.x : 0;
    const by = typeof b.y === 'number' ? b.y : 0;
    return ax + ay - (bx + by);
  });

  let svgElements = '';

  // ==========================================
  // STEPS 4, 5 & 6: ITERATE, CULL, & INSTANTIATE
  // ==========================================
  for (const node of sortedData) {
    const x = typeof node.x === 'number' ? node.x : 0;
    const y = typeof node.y === 'number' ? node.y : 0;
    const count = typeof node.count === 'number' ? node.count : 0;

    // Convert 2D matrix positions into flat pixel space mappings
    const isoX = (x - y) * (tileWidth / 2);
    const isoY = (x + y) * (tileHeight / 2);

    // STEP 4: Zero-Height Pruning
    if (count === 0) {
      // Omit building blocks; just lay a completely flat ground base footprint vector
      svgElements += `<use href="#iso-top" x="${isoX}" y="${isoY}" fill="#1e293b" opacity="0.2"/>\n`;
      continue;
    }

    // STEP 5: Adjacent Occlusion Culling Check
    // Get the height of the tower directly in front of this one (x-1, y-1)
    const frontTowerHeight = gridMap[`${x - 1},${y - 1}`] || 0;

    // If the element in front completely buries this tower's apex, skip it!
    if (frontTowerHeight >= count + 2) {
      continue;
    }

    // STEP 6: Scale blueprints to custom height offsets
    const calculatedHeight = count * blockHeightUnit;

    svgElements += `
    <g transform="translate(${isoX}, ${isoY})">
      <use href="#iso-left-unit" transform="scale(1, ${calculatedHeight})" fill="url(#left-shading)" />
      <use href="#iso-right-unit" transform="scale(1, ${calculatedHeight})" fill="url(#right-shading)" />
      
      <use href="#iso-top" transform="translate(0, -${calculatedHeight})" fill="#4ade80" />
    </g>\n`;
  }

  // ==========================================
  // STEP 7: OUTPUT FINISHED ROOT SVG STRING
  // ==========================================
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-200 -50 800 600" width="100%" height="100%" role="img" aria-labelledby="svg-title svg-desc">
  <title id="svg-title">GitHub Contribution Graph</title>
  <desc id="svg-desc">A 3D isometric visualization of GitHub contribution activity.</desc>
  ${svgDefs}
  <g id="monolith-grid">
    ${svgElements}
  </g>
</svg>`.trim();
}
