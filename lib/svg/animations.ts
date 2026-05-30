// Shared animation CSS injected into both static and auto-theme SVG renderers.
// Defined once here to avoid duplication — any curve/timing change only needs updating in one place.

// TOWER_BASE_Y: the vertical midpoint of the isometric ground floor diamond in local SVG space.
//
// Each ground tile is drawn as an isometric diamond:
//
//        y=0  ◆  ← back vertex
//            / \
//           /   \
//    y=10  ◆-----◆  ← midpoint / tower base
//           \   /
//            \ /
//        y=20 ◆  ← front vertex
//
// The diamond spans from y=0 to y=20, making y=10 the horizontal center line
// that acts as the visual ground level for each tower.
//
// This value is used as the CSS transform-origin for the grow-up animation so
// towers scale upward from their ground tile rather than from the SVG origin.
const TOWER_BASE_Y = 10;

export const TOWER_ANIMATION_CSS = `
  .cp-tower {
    transform: scaleY(0);
    transform-origin: 0 ${TOWER_BASE_Y}px;
    animation: grow-up 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  @keyframes grow-up {
    from { transform: scaleY(0); }
    to   { transform: scaleY(1); }
  }
  @media (prefers-reduced-motion: reduce) {
    .cp-tower { animation: none !important; transform: scaleY(1) !important; }
  }
`;
