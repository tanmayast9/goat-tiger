export interface BoardNode {
  id: number;
  x: number;
  y: number;
  label: string;
}

export interface JumpOption {
  over: number;
  to: number;
}

export const BOARD_WIDTH = 800;
export const BOARD_HEIGHT = 592;

export const INITIAL_TIGER_NODES = [0, 3, 4] as const;
export const TOTAL_GOATS = 15;
export const TIGERS_WIN_CAPTURES = 5;

/**
 * Traditional 23-point Aadu Puli Aattam (Tiger & Goat) triangular-rectangular grid.
 * All coordinates are exact integers so every straight line and jump triplet is strictly collinear.
 */
export const BOARD_NODES: BoardNode[] = [
  // Row 0: Apex
  { id: 0, x: 400, y: 56, label: 'Apex' },

  // Row 1 (y = 248)
  { id: 1, x: 48, y: 248, label: 'R1-1' },
  { id: 2, x: 268, y: 248, label: 'R1-2' },
  { id: 3, x: 356, y: 248, label: 'R1-3' },
  { id: 4, x: 444, y: 248, label: 'R1-4' },
  { id: 5, x: 532, y: 248, label: 'R1-5' },
  { id: 6, x: 752, y: 248, label: 'R1-6' },

  // Row 2 (y = 344)
  { id: 7, x: 48, y: 344, label: 'R2-1' },
  { id: 8, x: 202, y: 344, label: 'R2-2' },
  { id: 9, x: 334, y: 344, label: 'R2-3' },
  { id: 10, x: 466, y: 344, label: 'R2-4' },
  { id: 11, x: 598, y: 344, label: 'R2-5' },
  { id: 12, x: 752, y: 344, label: 'R2-6' },

  // Row 3 (y = 440)
  { id: 13, x: 48, y: 440, label: 'R3-1' },
  { id: 14, x: 136, y: 440, label: 'R3-2' },
  { id: 15, x: 312, y: 440, label: 'R3-3' },
  { id: 16, x: 488, y: 440, label: 'R3-4' },
  { id: 17, x: 664, y: 440, label: 'R3-5' },
  { id: 18, x: 752, y: 440, label: 'R3-6' },

  // Row 4: Triangle Base (y = 536)
  { id: 19, x: 70, y: 536, label: 'B1' },
  { id: 20, x: 290, y: 536, label: 'B2' },
  { id: 21, x: 510, y: 536, label: 'B3' },
  { id: 22, x: 730, y: 536, label: 'B4' },
];

/**
 * The 10 straight geometric lines defining both board edges and legal straight-line jump directions.
 */
export const BOARD_LINES: number[][] = [
  // Horizontal lines
  [1, 2, 3, 4, 5, 6],
  [7, 8, 9, 10, 11, 12],
  [13, 14, 15, 16, 17, 18],
  [19, 20, 21, 22],

  // Outer vertical wings
  [1, 7, 13],
  [6, 12, 18],

  // Four radiating triangle rays from Apex 0
  [0, 2, 8, 14, 19],
  [0, 3, 9, 15, 20],
  [0, 4, 10, 16, 21],
  [0, 5, 11, 17, 22],
];

/**
 * All unique undirected edges [a, b] for SVG rendering.
 */
export const BOARD_EDGES: [number, number][] = (() => {
  const seen = new Set<string>();
  const edges: [number, number][] = [];
  for (const line of BOARD_LINES) {
    for (let i = 0; i < line.length - 1; i++) {
      const a = line[i];
      const b = line[i + 1];
      const key = a < b ? `${a}-${b}` : `${b}-${a}`;
      if (!seen.has(key)) {
        seen.add(key);
        edges.push([a, b]);
      }
    }
  }
  return edges;
})();

/**
 * Adjacent nodes for every intersection 0..22.
 */
export const ADJACENCY: number[][] = (() => {
  const adj: number[][] = Array.from({ length: BOARD_NODES.length }, () => []);
  for (const [a, b] of BOARD_EDGES) {
    adj[a].push(b);
    adj[b].push(a);
  }
  return adj;
})();

/**
 * Legal straight-line jump triplets { over, to } from each intersection 0..22.
 */
export const JUMPS: JumpOption[][] = (() => {
  const jumps: JumpOption[][] = Array.from({ length: BOARD_NODES.length }, () => []);
  for (const line of BOARD_LINES) {
    for (let i = 0; i < line.length - 2; i++) {
      const a = line[i];
      const mid = line[i + 1];
      const c = line[i + 2];
      jumps[a].push({ over: mid, to: c });
      jumps[c].push({ over: mid, to: a });
    }
  }
  return jumps;
})();
