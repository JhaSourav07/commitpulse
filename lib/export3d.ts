// lib/export3d.ts

import type { TowerData } from './svg/layout';

/**
 * Generates an ASCII STL (STereoLithography) file string from the 2D isometric tower data.
 * This maps the logical grid (rows/cols) into a 3D Cartesian coordinate system (X, Y, Z),
 * generating the necessary triangular facets for a 3D printer to read.
 *
 * @param towers The normalized tower data array from computeTowers()
 * @returns A raw ASCII STL string
 */
export function generateMonolithSTL(towers: TowerData[]): string {
  const TILE_SIZE = 10; // 10mm x 10mm base for each commit tower
  const GAP = 2; // 2mm gap between towers
  const BASE_HEIGHT = 5; // 5mm thick base plate to hold the city together
  const Z_SCALE = 0.6; // Scale down the SVG height slightly for realistic 3D printing

  let stl = 'solid commitpulse_monolith\n';

  /**
   * Helper to write a single triangle facet to the STL string.
   * Keeps winding order counter-clockwise for correct 3D normals.
   */
  const addFacet = (
    nx: number,
    ny: number,
    nz: number,
    v1: number[],
    v2: number[],
    v3: number[]
  ) => {
    stl += `  facet normal ${nx} ${ny} ${nz}\n`;
    stl += `    outer loop\n`;
    stl += `      vertex ${v1[0].toFixed(2)} ${v1[1].toFixed(2)} ${v1[2].toFixed(2)}\n`;
    stl += `      vertex ${v2[0].toFixed(2)} ${v2[1].toFixed(2)} ${v2[2].toFixed(2)}\n`;
    stl += `      vertex ${v3[0].toFixed(2)} ${v3[1].toFixed(2)} ${v3[2].toFixed(2)}\n`;
    stl += `    endloop\n`;
    stl += `  endfacet\n`;
  };

  /**
   * Helper to draw a 3D box (rectangular prism).
   * A box has 6 faces, each made of 2 triangles (12 facets total).
   */
  const addBox = (x: number, y: number, z: number, w: number, d: number, h: number) => {
    const x2 = x + w;
    const y2 = y + d;
    const z2 = z + h;

    // Bottom Face (Z = z)
    addFacet(0, 0, -1, [x, y2, z], [x, y, z], [x2, y, z]);
    addFacet(0, 0, -1, [x2, y, z], [x2, y2, z], [x, y2, z]);

    // Top Face (Z = z2)
    addFacet(0, 0, 1, [x, y, z2], [x, y2, z2], [x2, y2, z2]);
    addFacet(0, 0, 1, [x2, y2, z2], [x2, y, z2], [x, y, z2]);

    // Front Face (Y = y)
    addFacet(0, -1, 0, [x, y, z], [x, y, z2], [x2, y, z2]);
    addFacet(0, -1, 0, [x2, y, z2], [x2, y, z], [x, y, z]);

    // Back Face (Y = y2)
    addFacet(0, 1, 0, [x2, y2, z], [x2, y2, z2], [x, y2, z2]);
    addFacet(0, 1, 0, [x, y2, z2], [x, y2, z], [x2, y2, z]);

    // Left Face (X = x)
    addFacet(-1, 0, 0, [x, y2, z], [x, y2, z2], [x, y, z2]);
    addFacet(-1, 0, 0, [x, y, z2], [x, y, z], [x, y2, z]);

    // Right Face (X = x2)
    addFacet(1, 0, 0, [x2, y, z], [x2, y, z2], [x2, y2, z2]);
    addFacet(1, 0, 0, [x2, y2, z2], [x2, y2, z], [x2, y, z]);
  };

  let maxRow = 0;
  let maxCol = 0;

  // 1. Build the Individual Commit Towers
  for (const t of towers) {
    if (t.row > maxRow) maxRow = t.row;
    if (t.col > maxCol) maxCol = t.col;

    // Skip drawing towers that have absolutely 0 height
    if (t.h <= 0) continue;

    const posX = t.row * (TILE_SIZE + GAP);
    const posY = t.col * (TILE_SIZE + GAP);
    // Real 3D height mapping
    const posZ = BASE_HEIGHT;
    const heightZ = Math.max(1, t.h * Z_SCALE); // Ensure at least 1mm bump for visible days

    addBox(posX, posY, posZ, TILE_SIZE, TILE_SIZE, heightZ);
  }

  // 2. Build the solid Base Plate
  const totalWidth = (maxRow + 1) * (TILE_SIZE + GAP) - GAP;
  const totalDepth = (maxCol + 1) * (TILE_SIZE + GAP) - GAP;

  // Center the entire model around (0,0) for easier 3D slicer placement
  // We apply this offset virtually via slicer or we could shift here
  // For simplicity, we just generate it from (0,0) and let the slicer center it
  addBox(0, 0, 0, totalWidth, totalDepth, BASE_HEIGHT);

  stl += 'endsolid commitpulse_monolith\n';

  return stl;
}
