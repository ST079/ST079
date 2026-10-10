// The town's map: roads, destinations, scenery, collision shapes and the road
// graph the car's autopilot drives along. Plain data and maths, no React.
//
// Coordinates are [x, z] on the ground. The camera looks north, so -z is "up"
// on screen. The roads form a 3x3 grid; each destination building sits beside
// a road and has a parking spot on it.

export type Vec2 = [number, number];

export type DestinationId = "about" | "experience" | "projects" | "skills" | "education" | "contact";

export interface Destination {
  id: DestinationId;
  /** Portfolio section, e.g. "Projects". */
  section: string;
  /** The building, e.g. "Data Center". */
  place: string;
  color: string;
  /** Where the car parks: a point on a road's centre line. */
  spot: Vec2;
  /** Building footprint (centre and [width, depth]) used for collisions. */
  center: Vec2;
  size: Vec2;
  /** Which way the building's entrance faces. */
  facing: "south" | "east";
  /** Height of the floating sign. */
  signHeight: number;
}

export const ROADS = [-30, 0, 30];
export const ROAD_WIDTH = 7;
const ROAD_HALF = ROAD_WIDTH / 2;
export const ROAD_SPAN = 60 + ROAD_WIDTH; // roads run from -33.5 to 33.5
/** Distance from a road's centre line to the middle of a lane (Nepal drives on the left). */
export const LANE_OFFSET = 1.75;
/** The car can't leave this square. */
export const WORLD_HALF = 44;

/** Each block is a raised sidewalk slab with a lawn on top. */
export const BLOCKS: Vec2[] = [
  [-15, -15],
  [15, -15],
  [-15, 15],
  [15, 15],
];
export const BLOCK_SIZE = 30 - ROAD_WIDTH; // 23, edge to edge between roads
export const LOT_SIZE = BLOCK_SIZE - 3; // 20, lawn inside the sidewalk
export const SIDEWALK_HEIGHT = 0.12;

export const destinations: Destination[] = [
  {
    id: "about",
    section: "About",
    place: "Home",
    color: "#e07a5f",
    spot: [-20, 0],
    center: [-20, -10],
    size: [9, 8],
    facing: "south",
    signHeight: 8.2,
  },
  {
    id: "experience",
    section: "Experience",
    place: "Veel HQ",
    color: "#3d5a80",
    spot: [10, 0],
    center: [10, -11],
    size: [8, 9],
    facing: "south",
    signHeight: 18.8,
  },
  {
    id: "projects",
    section: "Projects",
    place: "Data Center",
    color: "#2a9d8f",
    spot: [0, -20],
    center: [-10.5, -20],
    size: [8, 9],
    facing: "east",
    signHeight: 7.6,
  },
  {
    id: "skills",
    section: "Skills",
    place: "Tech Hub",
    color: "#e9a23b",
    spot: [0, 10],
    center: [-10.5, 10],
    size: [8, 8],
    facing: "east",
    signHeight: 9,
  },
  {
    id: "education",
    section: "Education",
    place: "University",
    color: "#7c6fd6",
    spot: [-15, 30],
    center: [-15, 20.5],
    size: [16, 9],
    facing: "south",
    signHeight: 10.6,
  },
  {
    id: "contact",
    section: "Contact",
    place: "Post Office",
    color: "#d64545",
    spot: [10, 30],
    center: [10, 21],
    size: [9, 7],
    facing: "south",
    signHeight: 7.4,
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

/** The car starts parked at Home, in the eastbound lane. */
export const START = { x: -20, z: -LANE_OFFSET, heading: Math.PI / 2 };

// ---------------------------------------------------------------------------
// Scenery
// ---------------------------------------------------------------------------

export interface Decor {
  center: Vec2;
  size: Vec2;
  height: number;
  color: string;
  roof: "flat" | "gable";
}

/** Ordinary buildings that fill the other lots. */
export const decor: Decor[] = [
  { center: [-20, -20.5], size: [8, 7], height: 7.5, color: "#f2cc8f", roof: "flat" },
  { center: [20, -20], size: [8, 8], height: 11, color: "#81b29a", roof: "flat" },
  { center: [9.5, -21], size: [7, 6], height: 5.5, color: "#f4f1de", roof: "flat" },
  { center: [20, -10], size: [7, 6], height: 4.2, color: "#e07a5f", roof: "flat" },
  { center: [-20, 10], size: [7, 6], height: 3.2, color: "#f6f1e7", roof: "gable" },
  { center: [20, 21], size: [8, 7], height: 9, color: "#9cb4cc", roof: "flat" },
];

/** A fountain on the corner lot by the central crossroads. */
export const FOUNTAIN: Vec2 = [-10, -10];

/** Deterministic pseudo-random numbers, so the town looks the same every visit. */
function seeded(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

export interface Tree {
  position: Vec2;
  scale: number;
  kind: 0 | 1; // round or cone
}

function scatter(
  rand: () => number,
  count: number,
  area: [number, number, number, number], // minX, maxX, minZ, maxZ
  keepOut: (x: number, z: number) => boolean,
) {
  const trees: Tree[] = [];
  let attempts = 0;
  while (trees.length < count && attempts < count * 40) {
    attempts++;
    const x = area[0] + rand() * (area[1] - area[0]);
    const z = area[2] + rand() * (area[3] - area[2]);
    if (keepOut(x, z)) continue;
    if (trees.some((t) => Math.hypot(t.position[0] - x, t.position[1] - z) < 2.6)) continue;
    trees.push({ position: [x, z], scale: 0.8 + rand() * 0.55, kind: rand() < 0.65 ? 0 : 1 });
  }
  return trees;
}

const insideBox = (x: number, z: number, center: Vec2, size: Vec2, margin: number) =>
  Math.abs(x - center[0]) < size[0] / 2 + margin && Math.abs(z - center[1]) < size[1] / 2 + margin;

const onRoad = (x: number, z: number) =>
  Math.abs(x) <= ROAD_SPAN / 2 + 1 &&
  Math.abs(z) <= ROAD_SPAN / 2 + 1 &&
  ROADS.some((r) => Math.abs(x - r) < ROAD_HALF + 1.2 || Math.abs(z - r) < ROAD_HALF + 1.2);

const blocked = (x: number, z: number) =>
  onRoad(x, z) ||
  destinations.some((d) => insideBox(x, z, d.center, d.size, 1.6)) ||
  decor.some((d) => insideBox(x, z, d.center, d.size, 1.6)) ||
  Math.hypot(x - FOUNTAIN[0], z - FOUNTAIN[1]) < 4.5;

const rand = seeded(79);

export const trees: Tree[] = [
  // A ring of woods around the town
  ...scatter(rand, 26, [-47, 47, -47, -36], blocked),
  ...scatter(rand, 26, [-47, 47, 36, 47], blocked),
  ...scatter(rand, 16, [-47, -36, -36, 36], blocked),
  ...scatter(rand, 16, [36, 47, -36, 36], blocked),
  // The park
  ...scatter(rand, 9, [6, 24, 6, 14], blocked),
  // Gardens in the remaining lots
  ...scatter(rand, 4, [-24, -16, 5, 14], blocked),
  ...scatter(rand, 3, [-24, -6, -25, -15], blocked),
  ...scatter(rand, 3, [14, 25, 14, 25], blocked),
];

// ---------------------------------------------------------------------------
// Collisions
// ---------------------------------------------------------------------------

export const boxes: { center: Vec2; size: Vec2 }[] = [
  ...destinations.map((d) => ({ center: d.center, size: d.size })),
  ...decor.map((d) => ({ center: d.center, size: d.size })),
];

export const circles: { center: Vec2; r: number }[] = [
  ...trees.map((t) => ({ center: t.position, r: 0.45 * t.scale })),
  { center: FOUNTAIN, r: 3 },
];

/** Ground height under a point: sidewalk slabs are slightly raised. */
export function groundHeight(x: number, z: number) {
  const half = BLOCK_SIZE / 2;
  return BLOCKS.some(([bx, bz]) => Math.abs(x - bx) < half && Math.abs(z - bz) < half)
    ? SIDEWALK_HEIGHT
    : 0;
}

// ---------------------------------------------------------------------------
// Road graph and route planning
// ---------------------------------------------------------------------------

const nodes: Vec2[] = [];
const edges: [number, number][] = [];

function nodeIndex(p: Vec2) {
  const i = nodes.findIndex((n) => n[0] === p[0] && n[1] === p[1]);
  if (i >= 0) return i;
  nodes.push(p);
  return nodes.length - 1;
}

// Every road is split into edges at its crossroads and at any parking spots on it.
for (const r of ROADS) {
  const along = (axis: 0 | 1) => {
    const points: Vec2[] = ROADS.map((t) => (axis === 0 ? [t, r] : [r, t]) as Vec2);
    for (const d of destinations) {
      if (d.spot[1 - axis] === r) points.push(d.spot);
    }
    points.sort((a, b) => a[axis] - b[axis]);
    for (let i = 0; i < points.length - 1; i++) {
      edges.push([nodeIndex(points[i]), nodeIndex(points[i + 1])]);
    }
  };
  along(0); // east-west road at z = r
  along(1); // north-south road at x = r
}

const dist = (a: Vec2, b: Vec2) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/** Closest point on the road network to `p`, and the edge it lies on. */
function nearestOnRoad(p: Vec2) {
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
 * Shortest path along the roads from `from` to the road point nearest `to`
 * (Dijkstra over the road graph plus two temporary nodes). Returns a polyline
 * along road centre lines; the car drives it in the left-hand lane.
 */
export function planRoute(from: Vec2, to: Vec2): Vec2[] {
  const start = nearestOnRoad(from);
  const end = nearestOnRoad(to);

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

  // Start from the car itself, then drop points that are on top of each other.
  return [from, ...path].filter((p, i, all) => i === 0 || dist(p, all[i - 1]) > 0.05);
}
