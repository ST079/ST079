// The town's map: a small take on Bhaktapur Durbar Square and Taumadhi Square.
// Plain data and maths, no React: destinations, landmarks, the row houses that
// enclose the squares, collision shapes, and the path graph the car's
// autopilot follows.
//
// Coordinates are [x, z] on the ground; -z is north (towards the palace and
// the Himalayas). Brick-paved open areas:
//   Durbar Square   x -46..46, z -20..20
//   Taumadhi Square x  27..79, z  36..80
//   a wide street south to the Newa home, and a lane south-east to Taumadhi.

export type Vec2 = [number, number];

export type DestinationId = "about" | "experience" | "projects" | "skills" | "education" | "contact";

export interface Destination {
  id: DestinationId;
  /** Portfolio section, e.g. "Projects". */
  section: string;
  /** The landmark, e.g. "Nyatapola Temple". */
  place: string;
  color: string;
  /** Where the car parks: a node of the path graph. */
  spot: Vec2;
  /** The landmark's centre, used for its sign and for framing it on arrival. */
  center: Vec2;
  /** Height of the floating sign. */
  signHeight: number;
}

export const destinations: Destination[] = [
  {
    id: "about",
    section: "About",
    place: "Newa Home",
    color: "#e07a5f",
    spot: [-13, 46],
    center: [-28.5, 46],
    signHeight: 14.5,
  },
  {
    id: "experience",
    section: "Experience",
    place: "55-Window Palace",
    color: "#3d5a80",
    spot: [-19, -15],
    center: [-19, -26],
    signHeight: 19,
  },
  {
    id: "projects",
    section: "Projects",
    place: "Nyatapola Temple",
    color: "#2a9d8f",
    spot: [39.5, 58],
    center: [53, 58],
    signHeight: 28,
  },
  {
    id: "skills",
    section: "Skills",
    place: "Vatsala Durga Temple",
    color: "#e9a23b",
    spot: [-1, -6],
    center: [10, -6],
    signHeight: 18.5,
  },
  {
    id: "education",
    section: "Education",
    place: "Golden Gate",
    color: "#7c6fd6",
    spot: [17, -15],
    center: [17, -22.5],
    signHeight: 12.5,
  },
  {
    id: "contact",
    section: "Contact",
    place: "Taleju Bell",
    color: "#d64545",
    spot: [32, -6],
    center: [26, -6],
    signHeight: 9.5,
  },
];

export const destinationById = Object.fromEntries(destinations.map((d) => [d.id, d])) as Record<
  DestinationId,
  Destination
>;

/** The suggested tour; each panel offers a drive to the next stop. */
export const TOUR: DestinationId[] = ["about", "experience", "projects", "skills", "education", "contact"];

export function nextStop(id: DestinationId): Destination {
  return destinationById[TOUR[(TOUR.indexOf(id) + 1) % TOUR.length]];
}

/** The car starts in Durbar Square, facing the palace. */
export const START = { x: 4, z: 12, heading: Math.PI };

/** Keep to the left of the path while driving (as in Nepal). */
export const LANE_OFFSET = 1.2;

/** The car can't leave this box. */
export const BOUNDS = { minX: -52, maxX: 84, minZ: -24, maxZ: 84 };

/** Brick-paved open ground, as [minX, maxX, minZ, maxZ]. */
export const PAVED: [number, number, number, number][] = [
  [-46, 46, -20, 20], // Durbar Square
  [27, 79, 36, 80], // Taumadhi Square
  [-23, -3, 20, 62], // street to the Newa home
  [27, 37, 20, 36], // lane to Taumadhi
];

// ---------------------------------------------------------------------------
// Landmarks (footprints and heights)
// ---------------------------------------------------------------------------

export interface Solid {
  center: Vec2;
  size: Vec2;
  height: number;
}

export const LANDMARKS = {
  // North side of Durbar Square, fronts along z = -20
  palace: { center: [-19, -26], size: [34, 12], height: 14 },
  gateWall: { center: [4, -23], size: [12, 6], height: 7 },
  goldenGate: { center: [17, -22.5], size: [14, 5], height: 10 },
  gallery: { center: [30, -25.5], size: [12, 11], height: 12 },
  // In the square
  vatsala: { center: [10, -6], size: [8, 8], height: 16 },
  bell: { center: [26, -6], size: [3.6, 3.6], height: 7 },
  pashupati: { center: [-12, 6], size: [7, 7], height: 12 },
  chyasilin: { center: [-30, 5], size: [8, 8], height: 9 },
  fasidega: { center: [40, 3], size: [8, 8], height: 14 },
  column: { center: [-26, -8], size: [1.6, 1.6], height: 9 },
  // Taumadhi Square
  nyatapola: { center: [53, 58], size: [13, 13], height: 26 },
  bhairabnath: { center: [68, 46], size: [10, 7], height: 13 },
  // Down the lane
  home: { center: [-28.5, 46], size: [9, 9], height: 13 },
} satisfies Record<string, Solid>;

// ---------------------------------------------------------------------------
// Row houses enclosing the squares and lanes
// ---------------------------------------------------------------------------

/** Deterministic pseudo-random numbers, so the town looks the same every visit. */
export function seeded(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

export interface House {
  center: Vec2;
  /** World-space footprint [x, z]. */
  size: Vec2;
  height: number;
  /** Unit vector the street front faces. */
  facing: Vec2;
  /** Width of the street front. */
  front: number;
  wall: string;
  roof: string;
}

interface Row {
  /** "x": the row runs along z at x = at. "z": it runs along x at z = at. */
  axis: "x" | "z";
  at: number;
  from: number;
  to: number;
  /** Which side of the line the houses stand on. */
  outward: 1 | -1;
  skip?: [number, number][];
}

const ROWS: Row[] = [
  // Durbar Square
  { axis: "x", at: -46, from: -20, to: 20, outward: -1 },
  { axis: "x", at: 46, from: -20, to: 20, outward: 1 },
  { axis: "z", at: 20, from: -46, to: 46, outward: 1, skip: [[-23, -3], [27, 37]] },
  { axis: "z", at: -20, from: -46, to: -36, outward: -1 },
  { axis: "z", at: -20, from: 36, to: 46, outward: -1 },
  // Street to the Newa home
  { axis: "x", at: -23, from: 29.5, to: 62, outward: -1, skip: [[40.5, 51.5]] },
  { axis: "x", at: -3, from: 29.5, to: 62, outward: 1 },
  { axis: "z", at: 62, from: -23, to: -3, outward: 1 },
  // Lane to Taumadhi, and Taumadhi Square
  { axis: "x", at: 27, from: 29.5, to: 80, outward: -1 },
  { axis: "x", at: 37, from: 29.5, to: 36, outward: 1 },
  { axis: "z", at: 36, from: 46, to: 79, outward: -1 },
  { axis: "x", at: 79, from: 36, to: 80, outward: 1 },
  { axis: "z", at: 80, from: 27, to: 79, outward: 1 },
];

const BRICK_WALLS = ["#9c4630", "#a34d35", "#8f3f2b", "#ab553b", "#96432f"];
const PLASTER_WALLS = ["#e9dcc4", "#e2cfb0", "#efe3cf"];
const ROOF_TILES = ["#5e3426", "#6b3a2a", "#57301f"];

function buildHouses() {
  const rand = seeded(1979);
  const houses: House[] = [];
  for (const row of ROWS) {
    let t = row.from;
    while (t < row.to - 2.5) {
      const width = Math.min(5 + rand() * 3, row.to - t);
      const skip = row.skip?.find(([a, b]) => t + width > a && t < b);
      if (skip) {
        t = skip[1];
        continue;
      }
      const depth = 7 + rand() * 2.5;
      const height = 7 + Math.floor(rand() * 3) * 2.6 + rand() * 0.8;
      const across = row.at + (row.outward * depth) / 2;
      const along = t + width / 2;
      const plaster = rand() < 0.18;
      houses.push({
        center: row.axis === "x" ? [across, along] : [along, across],
        size: row.axis === "x" ? [depth, width] : [width, depth],
        height,
        facing: row.axis === "x" ? [-row.outward, 0] : [0, -row.outward],
        front: width,
        wall: plaster
          ? PLASTER_WALLS[Math.floor(rand() * PLASTER_WALLS.length)]
          : BRICK_WALLS[Math.floor(rand() * BRICK_WALLS.length)],
        roof: ROOF_TILES[Math.floor(rand() * ROOF_TILES.length)],
      });
      t += width;
    }
  }
  return houses;
}

export const houses = buildHouses();

/** Staircases that reach out beyond their temple's footprint. */
const STAIRS: Solid[] = [
  { center: [LANDMARKS.nyatapola.center[0] - 8.1, LANDMARKS.nyatapola.center[1]], size: [3.2, 3], height: 6 },
  { center: [LANDMARKS.vatsala.center[0] - 4.8, LANDMARKS.vatsala.center[1]], size: [1.6, 2.2], height: 3 },
  { center: [LANDMARKS.fasidega.center[0], LANDMARKS.fasidega.center[1] + 4.7], size: [1.8, 1.4], height: 4 },
];

/** Everything the car (and the camera) can bump into. */
export const solids: Solid[] = [
  ...Object.values(LANDMARKS),
  ...STAIRS,
  ...houses.map((h) => ({ center: h.center, size: h.size, height: h.height })),
];

/** True if (x, z) is on open paving, at least `margin` from every building. */
export function isOpen(x: number, z: number, margin = 1) {
  const paved = PAVED.some(([x0, x1, z0, z1]) => x > x0 + margin && x < x1 - margin && z > z0 + margin && z < z1 - margin);
  if (!paved) return false;
  return !solids.some(
    (s) => Math.abs(x - s.center[0]) < s.size[0] / 2 + margin && Math.abs(z - s.center[1]) < s.size[1] / 2 + margin,
  );
}

// ---------------------------------------------------------------------------
// Scenery outside the town
// ---------------------------------------------------------------------------

/** The brick-paved town area, as [minX, maxX, minZ, maxZ]. */
export const TOWN_AREA: [number, number, number, number] = [-60, 94, -40, 96];

export interface Tree {
  position: Vec2;
  scale: number;
  kind: 0 | 1;
}

function buildTrees() {
  const rand = seeded(79);
  const trees: Tree[] = [];
  while (trees.length < 160) {
    const x = -150 + rand() * 330;
    const z = -130 + rand() * 300;
    if (x > TOWN_AREA[0] - 4 && x < TOWN_AREA[1] + 4 && z > TOWN_AREA[2] - 4 && z < TOWN_AREA[3] + 4) continue;
    trees.push({ position: [x, z], scale: 1 + rand() * 0.9, kind: rand() < 0.6 ? 0 : 1 });
  }
  return trees;
}

export const trees = buildTrees();

// ---------------------------------------------------------------------------
// Path graph and route planning
// ---------------------------------------------------------------------------

const node = {
  n1: [-40, -15],
  n2: destinationById.experience.spot,
  n3: [-1, -15],
  n4: destinationById.education.spot,
  n5: [32, -15],
  s1: [-40, 15],
  s2: [-13, 15],
  s3: [-1, 15],
  s4: [32, 15],
  m1: destinationById.skills.spot,
  e1: destinationById.contact.spot,
  t1: [32, 58],
  b1: destinationById.projects.spot,
  b2: [32, 74],
  a1: destinationById.about.spot,
  a2: [-13, 56],
} satisfies Record<string, Vec2>;

type NodeName = keyof typeof node;

// Straight runs that keep clear of every temple and house.
const LINKS: [NodeName, NodeName][] = [
  ["n1", "n2"], ["n2", "n3"], ["n3", "n4"], ["n4", "n5"], // along the palace front
  ["s1", "s2"], ["s2", "s3"], ["s3", "s4"], // along the south side of the square
  ["n1", "s1"], // west side
  ["n3", "m1"], ["m1", "s3"], // through the middle, past Vatsala
  ["n5", "e1"], ["e1", "s4"], // east side, past the bell
  ["s4", "t1"], ["t1", "b2"], ["t1", "b1"], // lane to Taumadhi, and a spur up to Nyatapola
  ["s2", "a1"], ["a1", "a2"], // lane to the Newa home
];

const names = Object.keys(node) as NodeName[];
const nodes: Vec2[] = names.map((n) => node[n] as Vec2);
const edges: [number, number][] = LINKS.map(([a, b]) => [names.indexOf(a), names.indexOf(b)]);

const dist = (a: Vec2, b: Vec2) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/** Closest point on the path graph to `p`, and the edge it lies on. */
function nearestOnPaths(p: Vec2) {
  let best = { point: nodes[0], edge: edges[0], d: Infinity };
  for (const edge of edges) {
    const [a, b] = [nodes[edge[0]], nodes[edge[1]]];
    const abx = b[0] - a[0];
    const abz = b[1] - a[1];
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * abx + (p[1] - a[1]) * abz) / (abx * abx + abz * abz)));
    const point: Vec2 = [a[0] + abx * t, a[1] + abz * t];
    const d = dist(p, point);
    if (d < best.d) best = { point, edge, d };
  }
  return best;
}

/**
 * Shortest way along the paths from `from` to the path point nearest `to`
 * (Dijkstra over the graph plus two temporary nodes).
 */
export function planRoute(from: Vec2, to: Vec2): Vec2[] {
  const start = nearestOnPaths(from);
  const end = nearestOnPaths(to);

  const points = [...nodes, start.point, end.point];
  const S = nodes.length;
  const T = nodes.length + 1;
  const adjacency: [number, number][][] = points.map(() => []);
  const link = (a: number, b: number) => {
    const w = dist(points[a], points[b]);
    adjacency[a].push([b, w]);
    adjacency[b].push([a, w]);
  };
  for (const [a, b] of edges) link(a, b);
  link(S, start.edge[0]);
  link(S, start.edge[1]);
  link(T, end.edge[0]);
  link(T, end.edge[1]);
  if (start.edge === end.edge) link(S, T);

  const best = points.map(() => Infinity);
  const previous = points.map(() => -1);
  const done = points.map(() => false);
  best[S] = 0;
  for (;;) {
    let u = -1;
    for (let i = 0; i < points.length; i++) {
      if (!done[i] && best[i] < Infinity && (u < 0 || best[i] < best[u])) u = i;
    }
    if (u < 0 || u === T) break;
    done[u] = true;
    for (const [v, w] of adjacency[u]) {
      if (best[u] + w < best[v]) {
        best[v] = best[u] + w;
        previous[v] = u;
      }
    }
  }

  const path: Vec2[] = [];
  for (let at = T; at >= 0; at = previous[at]) path.unshift(points[at]);
  return [from, ...path].filter((p, i, all) => i === 0 || dist(p, all[i - 1]) > 0.05);
}
