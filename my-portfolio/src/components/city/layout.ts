// The town's map: Bhaktapur Durbar Square (with Taumadhi Square beside it) and,
// a drive west along a road, Swayambhunath on its hill. Each place carries half
// of the portfolio. Plain data and maths, no React: destinations, landmarks,
// the row houses that enclose the squares, collision shapes, and the path
// graph the car's autopilot follows.
//
// Coordinates are [x, z] on the ground; -z is north (towards the palace and
// the Himalayas). Paved open areas:
//   Durbar Square   x  -46..46,  z -20..20
//   Taumadhi Square x   27..79,  z  36..80
//   a wide street south to the Newa home, and a lane south-east to Taumadhi
//   the road west   x  -97..-46, z  -4..8
//   Swayambhunath   x -166..-90, z -36..40, round the hill

export type Vec2 = [number, number];

export type DestinationId = "about" | "experience" | "projects" | "skills" | "education" | "contact";

export type AreaId = "bhaktapur" | "swayambhu";

/** The two places in town, in the order the tour visits them. */
export const AREAS: Record<AreaId, { name: string; short: string }> = {
  bhaktapur: { name: "Bhaktapur Durbar Square", short: "Bhaktapur" },
  swayambhu: { name: "Swayambhunath", short: "Swayambhu" },
};

/**
 * Swayambhunath's hill: its centre, its radius at the foot and on top, and the
 * height of the stone-paved top where the stupa stands.
 */
export const HILL = { center: [-128, 2] as Vec2, radius: 25, topRadius: 13.5, height: 12.2 };
/** Half-size of the square ring road round the hill. */
const RING = 31;

export interface Destination {
  id: DestinationId;
  /** Portfolio section, e.g. "Projects". */
  section: string;
  /** The landmark, e.g. "Nyatapola Temple". */
  place: string;
  /** Which of the two places it's in. */
  area: AreaId;
  color: string;
  /** Where the car parks: a node of the path graph. */
  spot: Vec2;
  /** The landmark's centre, used for its sign and for framing it on arrival. */
  center: Vec2;
  /** Height of the floating sign. */
  signHeight: number;
  /**
   * How the camera frames it on arrival, when the default (worked out from
   * the sign's height) doesn't suit: camera height, the height it aims at,
   * and optionally how far back it sits.
   */
  frame?: { height: number; look: number; distance?: number };
}

const [hx, hz] = HILL.center;

export const destinations: Destination[] = [
  // Bhaktapur
  {
    id: "about",
    section: "About",
    place: "Newa Home",
    area: "bhaktapur",
    color: "#e07a5f",
    spot: [-13, 46],
    center: [-28.5, 46],
    signHeight: 14.5,
  },
  {
    id: "experience",
    section: "Experience",
    place: "55-Window Palace",
    area: "bhaktapur",
    color: "#3d5a80",
    spot: [-19, -15],
    center: [-19, -26],
    signHeight: 19,
  },
  {
    id: "projects",
    section: "Projects",
    place: "Nyatapola Temple",
    area: "bhaktapur",
    color: "#2a9d8f",
    spot: [39.5, 58],
    center: [53, 58],
    signHeight: 28,
  },
  // Swayambhunath: the stairway up the east side, the stupa on top, and the
  // prayer wheels along the north foot of the hill.
  {
    id: "skills",
    section: "Skills",
    place: "Vajra Stairway",
    area: "swayambhu",
    color: "#e9a23b",
    spot: [hx + RING, hz],
    center: [hx + 11.5, hz], // the vajra at the top of the stairs
    signHeight: 19,
    frame: { height: 9, look: 8.5 }, // up the stairs, spire and all
  },
  {
    id: "education",
    section: "Education",
    place: "Swayambhu Stupa",
    area: "swayambhu",
    color: "#7c6fd6",
    spot: [hx, hz + RING],
    center: [hx, hz],
    signHeight: 29,
    frame: { height: 20, look: 15 }, // from up high, over the trees on the slope
  },
  {
    id: "contact",
    section: "Contact",
    place: "Prayer Wheels",
    area: "swayambhu",
    color: "#d64545",
    spot: [hx, hz - RING],
    center: [hx, hz - 25.5],
    signHeight: 6,
    frame: { height: 9, look: 5, distance: 5 }, // close in, clear of the houses behind
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

export type Rect = [minX: number, maxX: number, minZ: number, maxZ: number];

/** The road west from Durbar Square to Swayambhunath. */
export const ROAD: Rect = [-97, -46, -4, 8];

/** Where the car can go: the old town, the road, and the square round the hill. */
export const DRIVABLE: Rect[] = [
  [-52, 84, -24, 84], // Bhaktapur
  ROAD,
  [hx - 38, hx + 38, hz - 38, hz + 38], // Swayambhunath
];

/** Paved open ground. Indices matter: the townsfolk keep to one area each. */
export const PAVED: Rect[] = [
  [-46, 46, -20, 20], // 0 Durbar Square
  [27, 79, 36, 80], // 1 Taumadhi Square
  [-23, -3, 20, 62], // 2 street to the Newa home
  [27, 37, 20, 36], // 3 lane to Taumadhi
  [hx - 38, hx + 38, hz - 38, hz + 38], // 4 Swayambhunath, round the hill
  ROAD, // 5
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
  // Swayambhunath: the stupa on the hilltop, the foot of the east stairway
  // (where it sticks out past the hill), and the prayer wheels at the north foot
  stupa: { center: [hx, hz], size: [13.6, 13.6], height: HILL.height + 14.5 },
  stairway: { center: [hx + 25.4, hz], size: [2.4, 3.6], height: 2.6 },
  prayerWheels: { center: [hx, hz - 25.5], size: [16, 1.4], height: 2.9 },
} satisfies Record<string, Solid>;

/**
 * The hill, for collisions: three overlapping boxes that together roughly
 * fill its round foot (the car only knows about boxes).
 */
const HILL_SOLIDS: Solid[] = [
  { center: HILL.center, size: [HILL.radius * 2, HILL.radius * 0.83], height: HILL.height },
  { center: HILL.center, size: [HILL.radius * 0.83, HILL.radius * 2], height: HILL.height },
  { center: HILL.center, size: [HILL.radius * 1.42, HILL.radius * 1.42], height: HILL.height },
];

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
  /** Share of whitewashed (plaster) houses; the rest are brick. */
  plaster?: number;
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
  // Swayambhunath: monasteries and shops round the square, mostly whitewashed.
  // (Added last, so the houses above keep their looks.)
  { axis: "z", at: hz - 38, from: hx - 38, to: hx + 38, outward: -1, plaster: 0.6 },
  { axis: "z", at: hz + 38, from: hx - 38, to: hx + 38, outward: 1, plaster: 0.6 },
  { axis: "x", at: hx - 38, from: hz - 38, to: hz + 38, outward: -1, plaster: 0.6 },
  { axis: "x", at: hx + 38, from: hz - 38, to: hz + 38, outward: 1, plaster: 0.6 },
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
      const plaster = rand() < (row.plaster ?? 0.18);
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

const overlaps = (center: Vec2, size: Vec2, [x0, x1, z0, z1]: Rect) =>
  center[0] + size[0] / 2 > x0 && center[0] - size[0] / 2 < x1 && center[1] + size[1] / 2 > z0 && center[1] - size[1] / 2 < z1;

// The road runs out through a gap in the houses at both ends.
export const houses = buildHouses().filter((h) => !overlaps(h.center, h.size, ROAD));

/** Staircases that reach out beyond their temple's footprint. */
const STAIRS: Solid[] = [
  { center: [LANDMARKS.nyatapola.center[0] - 8.1, LANDMARKS.nyatapola.center[1]], size: [3.2, 3], height: 6 },
  { center: [LANDMARKS.vatsala.center[0] - 4.8, LANDMARKS.vatsala.center[1]], size: [1.6, 2.2], height: 3 },
  { center: [LANDMARKS.fasidega.center[0], LANDMARKS.fasidega.center[1] + 4.7], size: [1.8, 1.4], height: 4 },
];

/** Two soldiers standing guard either side of the Golden Gate's doorway. */
export const GATE_GUARDS: Vec2[] = [-2.3, 2.3].map((dx): Vec2 => [
  LANDMARKS.goldenGate.center[0] + dx,
  LANDMARKS.goldenGate.center[1] + LANDMARKS.goldenGate.size[1] / 2 + 0.5,
]);

/** Everything the car (and the camera) can bump into. */
export const solids: Solid[] = [
  ...Object.values(LANDMARKS),
  ...STAIRS,
  ...HILL_SOLIDS,
  ...GATE_GUARDS.map((center) => ({ center, size: [0.9, 0.9] as Vec2, height: 1.9 })),
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

/** The brick-paved area of Bhaktapur. */
export const TOWN_AREA: Rect = [-60, 94, -40, 96];
/** The stone-paved square round Swayambhunath's hill, houses included. */
export const SWAYAMBHU_AREA: Rect = [hx - 48, hx + 48, hz - 48, hz + 48];
/** The stretch of road through the fields between the two. */
export const ROAD_AREA: Rect = [SWAYAMBHU_AREA[1], TOWN_AREA[0], ROAD[2], ROAD[3]];

export interface Tree {
  position: Vec2;
  scale: number;
  kind: 0 | 1;
}

function buildTrees() {
  const rand = seeded(79);
  const trees: Tree[] = [];
  const near = ([x0, x1, z0, z1]: Rect, x: number, z: number, margin: number) =>
    x > x0 - margin && x < x1 + margin && z > z0 - margin && z < z1 + margin;
  while (trees.length < 200) {
    const x = -230 + rand() * 410;
    const z = -130 + rand() * 300;
    if (near(TOWN_AREA, x, z, 4) || near(SWAYAMBHU_AREA, x, z, 4) || near(ROAD_AREA, x, z, 3)) continue;
    trees.push({ position: [x, z], scale: 1 + rand() * 0.9, kind: rand() < 0.6 ? 0 : 1 });
  }
  return trees;
}

export const trees = buildTrees();

// ---------------------------------------------------------------------------
// Path graph and route planning
// ---------------------------------------------------------------------------

const node = {
  // Bhaktapur
  n1: [-40, -15],
  n2: destinationById.experience.spot,
  n3: [-1, -15],
  n4: [17, -15], // in front of the Golden Gate
  n5: [32, -15],
  s1: [-40, 15],
  s2: [-13, 15],
  s3: [-1, 15],
  s4: [32, 15],
  m1: [-1, -6], // beside Vatsala
  e1: [32, -6], // beside the Taleju bell
  t1: [32, 58],
  b1: destinationById.projects.spot,
  b2: [32, 74],
  a1: destinationById.about.spot,
  a2: [-13, 56],
  // The road west, and the ring road round Swayambhu's hill
  w1: [-40, 2],
  re: destinationById.skills.spot,
  rne: [hx + RING, hz - RING],
  rn: destinationById.contact.spot,
  rnw: [hx - RING, hz - RING],
  rw: [hx - RING, hz],
  rsw: [hx - RING, hz + RING],
  rs: destinationById.education.spot,
  rse: [hx + RING, hz + RING],
} satisfies Record<string, Vec2>;

type NodeName = keyof typeof node;

// Straight runs that keep clear of every temple and house.
const LINKS: [NodeName, NodeName][] = [
  ["n1", "n2"], ["n2", "n3"], ["n3", "n4"], ["n4", "n5"], // along the palace front
  ["s1", "s2"], ["s2", "s3"], ["s3", "s4"], // along the south side of the square
  ["n1", "w1"], ["w1", "s1"], // west side
  ["n3", "m1"], ["m1", "s3"], // through the middle, past Vatsala
  ["n5", "e1"], ["e1", "s4"], // east side, past the bell
  ["s4", "t1"], ["t1", "b2"], ["t1", "b1"], // lane to Taumadhi, and a spur up to Nyatapola
  ["s2", "a1"], ["a1", "a2"], // lane to the Newa home
  ["w1", "re"], // the road to Swayambhunath, arriving at the foot of the stairs
  ["re", "rne"], ["rne", "rn"], ["rn", "rnw"], ["rnw", "rw"], // round the hill...
  ["rw", "rsw"], ["rsw", "rs"], ["rs", "rse"], ["rse", "re"],
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
