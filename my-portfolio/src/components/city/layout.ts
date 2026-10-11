// The town's map: Bhaktapur Durbar Square (with Taumadhi Square beside it);
// a drive west along a road, Swayambhunath on its hill; and further west, past
// rice terraces, Pokhara's Lakeside on Phewa Lake, with a cycle path all the
// way round the lake. Bhaktapur carries three portfolio sections,
// Swayambhunath two, and the lake the last. Plain data and maths, no React:
// destinations, landmarks, the row houses that enclose the squares, collision
// shapes, and the path graph the car's autopilot follows.
//
// Coordinates are [x, z] on the ground; -z is north (towards the palace and
// the Himalayas). Paved open areas:
//   Durbar Square   x  -46..46,  z -20..20
//   Taumadhi Square x   27..79,  z  36..80
//   a wide street south to the Newa home, and a lane south-east to Taumadhi
//   the road west   x  -97..-46, z  -4..8
//   Swayambhunath   x -166..-90, z -36..40, round the hill
//   the road on     x -252..-159, z  -4..8, through rice terraces
//   Pokhara         x -302..-250, z -64..64, Lakeside, with Phewa Lake west of it
//                   and the cycle path round the lake

export type Vec2 = [number, number];

export type DestinationId = "about" | "experience" | "projects" | "skills" | "education" | "contact";

export type AreaId = "bhaktapur" | "swayambhu" | "pokhara";

/** The three places, in the order the tour visits them. */
export const AREAS: Record<AreaId, { name: string; short: string }> = {
  bhaktapur: { name: "Bhaktapur Durbar Square", short: "Bhaktapur" },
  swayambhu: { name: "Swayambhunath", short: "Swayambhu" },
  pokhara: { name: "Pokhara, Phewa Lake", short: "Pokhara" },
};

/**
 * Swayambhunath's hill: its centre, its radius at the foot and on top, and the
 * height of the stone-paved top where the stupa stands.
 */
export const HILL = { center: [-128, 2] as Vec2, radius: 25, topRadius: 13.5, height: 12.2 };
/** Half-size of the square ring road round the hill. */
const RING = 31;
/** Tal Barahi temple's island in Phewa Lake. */
export const ISLAND = { center: [-352, -8] as Vec2, radius: 9 };

export interface Destination {
  id: DestinationId;
  /** Portfolio section, e.g. "Projects". */
  section: string;
  /** The landmark, e.g. "Nyatapola Temple". */
  place: string;
  /** Which of the three places it's in. */
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
  // Swayambhunath: the stairway up the east side and the stupa on top.
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
  // Pokhara, at the end of the road: parked by the water at Lakeside, looking
  // out to Tal Barahi on its island. The stop is short of the cycle path, so a
  // parked car never blocks the cyclists.
  {
    id: "contact",
    section: "Contact",
    place: "Tal Barahi Temple",
    area: "pokhara",
    color: "#d64545",
    spot: [-286, 2],
    center: ISLAND.center,
    signHeight: 15,
    frame: { height: 6.5, look: 3.5, distance: 10 }, // low over the water
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

/** The road on from Swayambhunath to Pokhara. */
export const ROAD2: Rect = [-252, hx - 31, -4, 8];
/** Lakeside, Pokhara: the promenade by the water, the road, and shops behind. */
export const LAKESIDE: Rect = [-302, -250, -64, 64];

/**
 * Where the car can go: the old town, the roads, the square round the hill,
 * and Lakeside (plus the grounds all round the lake, see `nearestDrivable`).
 */
export const DRIVABLE: Rect[] = [
  [-52, 84, -24, 84], // Bhaktapur
  ROAD,
  [hx - 38, hx + 38, hz - 38, hz + 38], // Swayambhunath
  ROAD2,
  LAKESIDE,
];

/** Paved open ground. Indices matter: the townsfolk keep to one area each. */
export const PAVED: Rect[] = [
  [-46, 46, -20, 20], // 0 Durbar Square
  [27, 79, 36, 80], // 1 Taumadhi Square
  [-23, -3, 20, 62], // 2 street to the Newa home
  [27, 37, 20, 36], // 3 lane to Taumadhi
  [hx - 38, hx + 38, hz - 38, hz + 38], // 4 Swayambhunath, round the hill
  ROAD, // 5
  LAKESIDE, // 6 Pokhara
  ROAD2, // 7
];

/** The brick-paved area of Bhaktapur. */
export const TOWN_AREA: Rect = [-60, 94, -40, 96];
/** The stone-paved square round Swayambhunath's hill, houses included. */
export const SWAYAMBHU_AREA: Rect = [hx - 48, hx + 48, hz - 48, hz + 48];
/** The stretch of road through the fields between the two. */
export const ROAD_AREA: Rect = [SWAYAMBHU_AREA[1], TOWN_AREA[0], ROAD[2], ROAD[3]];
/** Lakeside's paved area, the buildings behind it included. */
export const POKHARA_AREA: Rect = [-302, -240, -76, 76];
/** The road from Swayambhunath to Lakeside, through the fields. */
export const ROAD2_AREA: Rect = [POKHARA_AREA[1], SWAYAMBHU_AREA[0], ROAD2[2], ROAD2[3]];
/** Rice terraces either side of that road. */
export const TERRACES: Rect[] = [
  [-234, -182, ROAD2[3] + 4, ROAD2[3] + 40],
  [-234, -182, ROAD2[2] - 40, ROAD2[2] - 4],
];
/** The two hills across the lake: the Peace Pagoda's to the south, Sarangkot to the north. */
// Both stand back from the cycle path round the lake.
export const LAKE_HILLS = {
  pagoda: { center: [-404, 204] as Vec2, radius: 64, height: 38 },
  sarangkot: { center: [-392, -236] as Vec2, radius: 92, height: 56 },
};

// ---------------------------------------------------------------------------
// Pokhara: Phewa Lake
// ---------------------------------------------------------------------------

/**
 * Phewa Lake's shoreline, clockwise from where Lakeside's promenade meets the
 * water at its north end (the promenade is the straight east shore, x = -302).
 */
export const LAKE: Vec2[] = [
  [-302, -64], [-301, -90], [-318, -110], [-352, -120], [-392, -114], [-432, -100],
  [-462, -68], [-476, -20], [-472, 30], [-454, 76], [-418, 106], [-372, 118],
  [-334, 108], [-310, 86], [-302, 64],
];
/** The nearest point on the lake's shoreline to (x, z), and how far it is. */
export function nearestShore(x: number, z: number) {
  let best = { point: LAKE[0], distance: Infinity };
  for (let i = 0, j = LAKE.length - 1; i < LAKE.length; j = i++) {
    const [ax, az] = LAKE[j];
    const [bx, bz] = LAKE[i];
    const t = Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (z - az) * (bz - az)) / ((bx - ax) ** 2 + (bz - az) ** 2)));
    const point: Vec2 = [ax + (bx - ax) * t, az + (bz - az) * t];
    const distance = Math.hypot(point[0] - x, point[1] - z);
    if (distance < best.distance) best = { point, distance };
  }
  return best;
}

/** Distance from (x, z) to the lake's shoreline. */
export function shoreDistance(x: number, z: number) {
  return nearestShore(x, z).distance;
}

/** True if (x, z) is within the shoreline (the island counts as water here). */
export function insideShore(x: number, z: number) {
  let inside = false;
  for (let i = 0, j = LAKE.length - 1; i < LAKE.length; j = i++) {
    const [xi, zi] = LAKE[i];
    const [xj, zj] = LAKE[j];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

/** True if (x, z) is on the lake, at least `margin` from the shore and the island. */
export function inLake(x: number, z: number, margin = 0) {
  if (Math.hypot(x - ISLAND.center[0], z - ISLAND.center[1]) < ISLAND.radius + margin) return false;
  return insideShore(x, z) && (margin <= 0 || shoreDistance(x, z) >= margin);
}

// ---------------------------------------------------------------------------
// The cycle path round Phewa Lake
// ---------------------------------------------------------------------------

/** How far the cycle path's centre line keeps from the shore, and its half-width. */
export const LAKE_PATH_OFFSET = 7.5;
export const LAKE_PATH_HALF_WIDTH = 2.5;
/** Each lane's distance from the centre line (cyclists keep left, as in Nepal). */
export const LAKE_PATH_LANE = 1;
/** Spacing of the path's points. */
const PATH_STEP = 1;

export interface LakePath {
  /** Evenly spaced points (PATH_STEP apart) round the centre line, a closed loop. */
  points: Vec2[];
  /** Unit tangents, in the order of the points. */
  tangents: Vec2[];
  /** Unit normals, pointing away from the lake. */
  normals: Vec2[];
  length: number;
}

/**
 * The path's centre line: the shoreline pushed out by LAKE_PATH_OFFSET,
 * smoothed into a curve (Catmull-Rom) and resampled evenly.
 */
function buildLakePath(): LakePath {
  // Split long shore edges, so the curve keeps to the straight promenade.
  const shore: Vec2[] = [];
  LAKE.forEach((a, i) => {
    const b = LAKE[(i + 1) % LAKE.length];
    const pieces = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 16);
    for (let k = 0; k < pieces; k++) shore.push([a[0] + ((b[0] - a[0]) * k) / pieces, a[1] + ((b[1] - a[1]) * k) / pieces]);
  });
  const n = shore.length;
  const control = shore.map((p, i): Vec2 => {
    const prev = shore[(i - 1 + n) % n];
    const next = shore[(i + 1) % n];
    let nx = prev[1] - next[1];
    let nz = next[0] - prev[0];
    const len = Math.hypot(nx, nz);
    nx /= len;
    nz /= len;
    if (inLake(p[0] + nx, p[1] + nz)) [nx, nz] = [-nx, -nz];
    return [p[0] + nx * LAKE_PATH_OFFSET, p[1] + nz * LAKE_PATH_OFFSET];
  });

  const dense: Vec2[] = [];
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [-1, 0, 1, 2].map((k) => control[(i + k + n) % n]);
    for (let k = 0; k < 8; k++) {
      const t = k / 8;
      const f = (a: number, b: number, c: number, d: number) =>
        0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (3 * b - a - 3 * c + d) * t * t * t);
      dense.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }

  const points: Vec2[] = [];
  let carry = 0;
  dense.forEach((a, i) => {
    const b = dense[(i + 1) % dense.length];
    const seg = Math.hypot(b[0] - a[0], b[1] - a[1]);
    let at = carry;
    for (; at < seg; at += PATH_STEP) points.push([a[0] + ((b[0] - a[0]) * at) / seg, a[1] + ((b[1] - a[1]) * at) / seg]);
    carry = at - seg;
  });

  const count = points.length;
  const tangents = points.map((_, i): Vec2 => {
    const a = points[(i - 1 + count) % count];
    const b = points[(i + 1) % count];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    return [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
  });
  // Normals turn the same way all round; pick the way that faces off the water.
  const [px, pz] = points[0];
  const [tx, tz] = tangents[0];
  const away = shoreDistance(px - tz, pz + tx) > shoreDistance(px + tz, pz - tx) ? 1 : -1;
  const normals = tangents.map(([x, z]): Vec2 => [-z * away, x * away]);
  return { points, tangents, normals, length: count * PATH_STEP };
}

export const LAKE_PATH = buildLakePath();

/** Position, direction and outward normal at distance `s` round the path. */
export function lakePathAt(s: number) {
  const { points, tangents, normals, length } = LAKE_PATH;
  const n = points.length;
  const u = (((s % length) + length) % length) / PATH_STEP;
  const i = Math.floor(u) % n;
  const j = (i + 1) % n;
  const f = u - Math.floor(u);
  const mix = (a: Vec2, b: Vec2): Vec2 => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
  return { point: mix(points[i], points[j]), tangent: mix(tangents[i], tangents[j]), normal: mix(normals[i], normals[j]) };
}

/** Nearest point on the path's centre line to (x, z), how far it is, and how far round. */
export function nearestOnLakePath(x: number, z: number) {
  const { points } = LAKE_PATH;
  let best = { point: points[0], distance: Infinity, s: 0 };
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    const abx = b[0] - a[0];
    const abz = b[1] - a[1];
    const t = Math.max(0, Math.min(1, ((x - a[0]) * abx + (z - a[1]) * abz) / (abx * abx + abz * abz || 1)));
    const point: Vec2 = [a[0] + abx * t, a[1] + abz * t];
    const distance = Math.hypot(x - point[0], z - point[1]);
    if (distance < best.distance) best = { point, distance, s: (i + t) * PATH_STEP };
  }
  return best;
}

/**
 * Nearest point to (x, z) on the drivable ground (the paving and roads, and
 * the lake's grounds), or null if it's already on it.
 */
export function nearestDrivable(x: number, z: number): Vec2 | null {
  let nearest: Vec2 | null = null;
  let nearestDistance = Infinity;
  for (const [x0, x1, z0, z1] of DRIVABLE) {
    const cx = Math.min(Math.max(x, x0), x1);
    const cz = Math.min(Math.max(z, z0), z1);
    const d = Math.hypot(x - cx, z - cz);
    if (d === 0) return null;
    if (d < nearestDistance) {
      nearestDistance = d;
      nearest = [cx, cz];
    }
  }
  // Round the lake: anywhere from just off the stone border out to the houses.
  const { near, far } = LAKE_GROUNDS;
  const shore = nearestShore(x, z);
  const inside = insideShore(x, z);
  if (!inside && shore.distance >= near && shore.distance <= far) return null;
  const [qx, qz] = shore.point;
  const d = shore.distance || 1e-6;
  // Out of the water (or off the border) to `near`; in from the fields to `far`.
  const out = inside ? -1 : 1;
  const k = (inside || shore.distance < near ? near : far) / d;
  const point: Vec2 = [qx + (x - qx) * out * k, qz + (z - qz) * out * k];
  if (Math.hypot(point[0] - x, point[1] - z) < nearestDistance) nearest = point;
  return nearest;
}

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
  // Lakeside, Pokhara: hotels and cafés facing the lake, and the ends of the street.
  { axis: "x", at: -250, from: -64, to: 64, outward: 1, plaster: 0.75 },
  { axis: "z", at: -64, from: -282, to: -250, outward: -1, plaster: 0.75 },
  { axis: "z", at: 64, from: -282, to: -250, outward: 1, plaster: 0.75 },
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

// The roads run out through gaps in the houses at both ends.
const townHouses = buildHouses().filter((h) => !overlaps(h.center, h.size, ROAD) && !overlaps(h.center, h.size, ROAD2));

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

// ---------------------------------------------------------------------------
// Round the lake: a stone border along the water, benches, boat landings with
// food stalls, a playground, lamps, trees and houses, laid out along the
// cycle path. You can ride anywhere from the border out to the houses.
// ---------------------------------------------------------------------------

/** The stone border along the shore: its width (it stands just in the water) and height. */
export const LAKE_KERB = { width: 0.6, height: 0.45 };
/** How far from the shore you can ride: from just off the border out to the houses. */
export const LAKE_GROUNDS = { near: 1.0, far: 19.5 };
/** Where the lakeside houses' fronts stand, out from the shore. */
const HOUSE_LINE = 18.5;

/** Something placed by the lake, and the way it faces (towards the water). */
export interface Placed {
  at: Vec2;
  facing: Vec2;
}

/** A point given in a placed thing's own frame (x across, z the way it faces), in the world. */
export function inFrame({ at, facing }: Placed, x: number, z: number): Vec2 {
  const [fx, fz] = facing;
  return [at[0] + fz * x + fx * z, at[1] - fx * x + fz * z];
}

/** The point `d` out from the shore at `s` round the cycle path, facing the water. */
export function lakeside(s: number, d: number): Placed {
  const { point, normal } = lakePathAt(s);
  const k = d - LAKE_PATH_OFFSET;
  return { at: [point[0] + normal[0] * k, point[1] + normal[1] * k], facing: [-normal[0], -normal[1]] };
}

/** How far apart two places round the path are, either way round. */
export function ringGap(a: number, b: number) {
  const d = Math.abs(a - b) % LAKE_PATH.length;
  return Math.min(d, LAKE_PATH.length - d);
}

/** World-space box round a `width` x `depth` footprint turned to face `facing`. */
function footprint({ at, facing }: Placed, width: number, depth: number, height: number): Solid {
  const [fx, fz] = facing;
  return {
    center: at,
    size: [Math.abs(fz) * width + Math.abs(fx) * depth, Math.abs(fx) * width + Math.abs(fz) * depth],
    height,
  };
}

/** Boat landings round the lake: where on the shore, and the way out over the water. */
export interface Port {
  s: number;
  at: Vec2;
  into: Vec2;
}
export const PORTS: Port[] = (
  [
    [-372, -117], // north shore, under Sarangkot
    [-474.5, 5], // the far, west shore
    [-395, 112.5], // south shore, for the walk up to the Peace Pagoda
  ] as Vec2[]
).map(([x, z]) => {
  const s = nearestOnLakePath(x, z).s;
  const { at, facing } = lakeside(s, 0);
  return { s, at, into: facing };
});
/** How long the landings' jetties reach out over the water. */
export const PORT_JETTY = 7;

/** A ticket hut behind each landing. */
export const KIOSKS: Placed[] = PORTS.map((p) => lakeside(p.s, 13.6));

/** Food stalls: along Lakeside between the shade trees, and beside each landing's hut. */
export interface Stall extends Placed {
  /** 0 momo, 1 roasted corn, 2 tea and fruit. */
  kind: 0 | 1 | 2;
}
export const STALL_SIZE = { width: 2.6, depth: 1.8 };
export const STALLS: Stall[] = [
  ...[-52.2, -40.6, 29, 40.6].map((z, i): Stall => ({ at: [-288.8, z], facing: [-1, 0], kind: (i % 3) as Stall["kind"] })),
  ...PORTS.flatMap((p, i) =>
    [-6.5, 6.5].map((ds, j): Stall => ({ ...lakeside(p.s + ds, 13.6), kind: ((i + j + 1) % 3) as Stall["kind"] })),
  ),
];

/** A fenced playground on the grass north of Lakeside, beside the cycle path. */
export const PLAYGROUND: Rect = [-289, -275, -92, -79];

const near = ([x0, x1, z0, z1]: Rect, [x, z]: Vec2, margin: number) =>
  x > x0 - margin && x < x1 + margin && z > z0 - margin && z < z1 + margin;

/** True where the lake's own furniture shouldn't go: Lakeside, the landings and the playground. */
function busy(s: number, at: Vec2) {
  return near(POKHARA_AREA, at, 3) || near(PLAYGROUND, at, 3) || PORTS.some((p) => ringGap(p.s, s) < 14);
}

/** Benches facing the water, every 30 m round the lake. */
export const LAKE_BENCHES: Placed[] = Array.from({ length: Math.floor(LAKE_PATH.length / 30) }, (_, i) => 6 + i * 30)
  .map((s) => ({ s, ...lakeside(s, 2.6) }))
  .filter(({ s, at }) => !busy(s, at))
  .map(({ at, facing }) => ({ at, facing }));

/** Lamps along the outer edge of the cycle path. */
export const LAKE_LAMPS: Vec2[] = Array.from({ length: Math.floor(LAKE_PATH.length / 30) }, (_, i) => 21 + i * 30)
  .map((s) => ({ s, ...lakeside(s, 10.9) }))
  .filter(({ s, at }) => !busy(s, at))
  .map(({ at }) => at);

/** Trees all round: a ring outside the cycle path, and a few by the water between the benches. */
export const LAKE_TREES: Vec2[] = [
  ...Array.from({ length: Math.floor(LAKE_PATH.length / 11) }, (_, i) => ({ s: i * 11, d: 12.8 })),
  ...Array.from({ length: Math.floor(LAKE_PATH.length / 60) }, (_, i) => ({ s: 21 + i * 60, d: 3.4 })),
]
  .map(({ s, d }) => ({ s, at: lakeside(s, d).at }))
  .filter(({ s, at }) => !busy(s, at))
  .map(({ at }) => at);

// Painted walls and tin roofs, as round Phewa.
const LAKE_WALLS = ["#f3e3c3", "#cfe1e6", "#f2c9b5", "#ece3a6", "#d7e7cf", "#efe7d8", "#f4d3d3"];
const TIN_ROOFS = ["#a63a2b", "#3f6f5a", "#3d5a80", "#8a3324", "#5e3426"];
/** Where along the shore houses stand: areas their fronts fall in. */
const LAKE_VILLAGES: Rect[] = [
  [-368, -318, -160, -100], // north shore, under Sarangkot
  [-366, -316, 95, 160], // south-east shore
  [-525, -470, -16, 52], // the far, west shore
];

/** Houses and lodges facing the lake, squared up to the nearest axis like the town's. */
function buildLakeHouses() {
  const rand = seeded(2081);
  const built: House[] = [];
  const furniture: Solid[] = [
    ...KIOSKS.map((k) => footprint(k, 2.4, 2.4, 3)),
    ...STALLS.map((st) => footprint(st, STALL_SIZE.width, STALL_SIZE.depth, 2.6)),
  ];
  const clashes = (center: Vec2, size: Vec2) => {
    const [cx, cz] = center;
    const [hw, hd] = [size[0] / 2, size[1] / 2];
    const corners: Vec2[] = [[cx - hw, cz - hd], [cx + hw, cz - hd], [cx - hw, cz + hd], [cx + hw, cz + hd]];
    if (corners.some(([x, z]) => insideShore(x, z) || shoreDistance(x, z) < HOUSE_LINE - 4)) return true;
    if (Object.values(LAKE_HILLS).some((h) => corners.some(([x, z]) => Math.hypot(x - h.center[0], z - h.center[1]) < h.radius + 2))) return true;
    const box: Rect = [cx - hw, cx + hw, cz - hd, cz + hd];
    const hits = (o: { center: Vec2; size: Vec2 }, gap: number) =>
      Math.abs(o.center[0] - cx) < (o.size[0] + size[0]) / 2 + gap && Math.abs(o.center[1] - cz) < (o.size[1] + size[1]) / 2 + gap;
    return (
      built.some((h) => hits(h, 1.2)) ||
      furniture.some((f) => hits(f, 1)) ||
      [POKHARA_AREA, PLAYGROUND, ROAD2_AREA, ...TERRACES].some((r) => overlaps([(r[0] + r[1]) / 2, (r[2] + r[3]) / 2], [r[1] - r[0] + 4, r[3] - r[2] + 4], box))
    );
  };
  for (let s = 0; s < LAKE_PATH.length; ) {
    const { at: front, facing: toLake } = lakeside(s, HOUSE_LINE);
    if (!LAKE_VILLAGES.some((v) => near(v, front, 0))) {
      s += 2;
      continue;
    }
    // Face the water, squared up to the nearest axis (and only where that's close).
    const facing: Vec2 = Math.abs(toLake[0]) > Math.abs(toLake[1]) ? [Math.sign(toLake[0]), 0] : [0, Math.sign(toLake[1])];
    const width = 6 + rand() * 2.5;
    const depth = 7 + rand() * 2;
    const height = 6 + Math.floor(rand() * 2) * 2.6 + rand() * 0.8;
    const center: Vec2 = [front[0] - (facing[0] * depth) / 2, front[1] - (facing[1] * depth) / 2];
    const size: Vec2 = facing[0] !== 0 ? [depth, width] : [width, depth];
    if (facing[0] * toLake[0] + facing[1] * toLake[1] < 0.87 || clashes(center, size)) {
      s += 2;
      continue;
    }
    built.push({
      center,
      size,
      height,
      facing,
      front: width,
      wall: LAKE_WALLS[Math.floor(rand() * LAKE_WALLS.length)],
      roof: TIN_ROOFS[Math.floor(rand() * TIN_ROOFS.length)],
    });
    s += width + 1.5 + rand() * 3;
  }
  return built;
}

/** Every house: the town's rows and those round the lake. */
export const houses = [...townHouses, ...buildLakeHouses()];

/** Shade trees along Lakeside's promenade, with a gap where the road meets the water. */
export const LAKESIDE_TREES: Vec2[] = Array.from({ length: 11 }, (_, i): Vec2 => [-283.5, -58 + i * 11.6]).filter(
  ([, z]) => Math.abs(z - 2) > 6,
);
/** A shade tree round the lake or along Lakeside: where, how big, and its look. */
export interface ShadeTree {
  at: Vec2;
  scale: number;
  /** Which foliage colour. */
  shade: number;
  spin: number;
}
const treeRand = seeded(4410);
/** Every shade tree: the ring round the lake, then Lakeside's along the promenade. */
export const SHADE_TREES: ShadeTree[] = [...LAKE_TREES, ...LAKESIDE_TREES].map((at, i) => ({
  at,
  scale: i < LAKE_TREES.length ? 0.8 + treeRand() * 0.45 : 1.1,
  shade: Math.floor(treeRand() * 4),
  spin: treeRand() * 3,
}));
/** A shade tree's crown: the height of its centre, and its radius. */
export const crownOf = (t: ShadeTree) => ({ y: 3.9 * t.scale, radius: 2.2 * t.scale });

/** Street lamps between the waterside walk and the cycle lanes. */
export const LAKESIDE_LAMPS: Vec2[] = Array.from({ length: 13 }, (_, i): Vec2 => [-297.5, -60 + i * 10]);
/** Benches at the water's edge, facing the lake (clear of the jetty at z = 24). */
export const BENCH_SEAT = 0.47;
export const LAKESIDE_BENCHES: Vec2[] = [-54, -38, -20, 8, 38, 52].map((z): Vec2 => [-301.3, z]);
/** The waterside walk, between the embankment and the lamps: where visitors stroll. */
export const PROMENADE_WALK: Rect = [-300.4, -298.3, -60, 60];

/** Everything the car (and the camera) can bump into. */
export const solids: Solid[] = [
  ...Object.values(LANDMARKS),
  ...STAIRS,
  ...HILL_SOLIDS,
  ...GATE_GUARDS.map((center) => ({ center, size: [0.9, 0.9] as Vec2, height: 1.9 })),
  ...LAKESIDE_TREES.map((center) => ({ center, size: [1, 1] as Vec2, height: 3 })),
  ...LAKESIDE_LAMPS.map((center) => ({ center, size: [0.3, 0.3] as Vec2, height: 3.4 })),
  ...LAKESIDE_BENCHES.map((center) => ({ center, size: [0.6, 1.9] as Vec2, height: 0.9 })),
  ...houses.map((h) => ({ center: h.center, size: h.size, height: h.height })),
  // Round the lake
  ...KIOSKS.map((k) => footprint(k, 2.4, 2.4, 3)),
  ...STALLS.map((st) => footprint(st, STALL_SIZE.width, STALL_SIZE.depth, 2.6)),
  ...LAKE_BENCHES.map((b) => footprint(b, 1.8, 0.6, 0.9)),
  ...LAKE_LAMPS.map((center) => ({ center, size: [0.3, 0.3] as Vec2, height: 3.4 })),
  ...LAKE_TREES.map((center) => ({ center, size: [1, 1] as Vec2, height: 3 })),
  { center: [(PLAYGROUND[0] + PLAYGROUND[1]) / 2, (PLAYGROUND[2] + PLAYGROUND[3]) / 2], size: [PLAYGROUND[1] - PLAYGROUND[0], PLAYGROUND[3] - PLAYGROUND[2]], height: 1 },
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

export interface Tree {
  position: Vec2;
  scale: number;
  kind: 0 | 1;
}

function buildTrees() {
  const rand = seeded(79);
  const trees: Tree[] = [];
  while (trees.length < 340) {
    const x = -520 + rand() * 700;
    const z = -150 + rand() * 360;
    if (near(TOWN_AREA, [x, z], 4) || near(SWAYAMBHU_AREA, [x, z], 4) || near(ROAD_AREA, [x, z], 3)) continue;
    if (near(POKHARA_AREA, [x, z], 4) || near(ROAD2_AREA, [x, z], 3) || TERRACES.some((t) => near(t, [x, z], 2))) continue;
    // Not in the lake or on its island, nor on its grounds (they have trees of
    // their own), by its houses, or on the hills across it (likewise)
    if (insideShore(x, z) || shoreDistance(x, z) < LAKE_GROUNDS.far + 3) continue;
    if (houses.some((h) => near([h.center[0] - h.size[0] / 2, h.center[0] + h.size[0] / 2, h.center[1] - h.size[1] / 2, h.center[1] + h.size[1] / 2], [x, z], 3))) continue;
    if (Math.hypot(x - ISLAND.center[0], z - ISLAND.center[1]) < ISLAND.radius + 2) continue;
    if (Object.values(LAKE_HILLS).some((h) => Math.hypot(x - h.center[0], z - h.center[1]) < h.radius)) continue;
    trees.push({ position: [x, z], scale: 1 + rand() * 0.9, kind: rand() < 0.6 ? 0 : 1 });
  }
  return trees;
}

export const trees = buildTrees();

// ---------------------------------------------------------------------------
// Path graph and route planning
// ---------------------------------------------------------------------------

function dist(a: Vec2, b: Vec2) {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

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
  rn: [hx, hz - RING],
  rnw: [hx - RING, hz - RING],
  rw: [hx - RING, hz],
  rsw: [hx - RING, hz + RING],
  rs: destinationById.education.spot,
  rse: [hx + RING, hz + RING],
  // On to Pokhara: through the terraces to Lakeside, along it, and down to the water
  pe: [-250, 2],
  lc: [-266, 2],
  ln: [-266, -56],
  ls: [-266, 56],
  lake: destinationById.contact.spot,
} satisfies Record<string, Vec2>;

// The cycle path round the lake, as a loop of nodes every 10 m, joined to
// Lakeside where the road meets the water.
const RING_EVERY = 10;
const ringNodes = Object.fromEntries(
  LAKE_PATH.points.filter((_, i) => i % RING_EVERY === 0).map((p, i) => [`lp${i}`, p]),
) as Record<`lp${number}`, Vec2>;
const ringNames = Object.keys(ringNodes) as `lp${number}`[];
const ringJoin = ringNames.reduce((best, name) =>
  dist(ringNodes[name], node.lake) < dist(ringNodes[best], node.lake) ? name : best,
);

type NodeName = keyof typeof node | `lp${number}`;

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
  ["rw", "pe"], ["pe", "lc"], ["lc", "ln"], ["lc", "ls"], ["lc", "lake"], // Pokhara
  ["lake", ringJoin], // ...and on to the cycle path
  ...ringNames.map((name, i): [NodeName, NodeName] => [name, ringNames[(i + 1) % ringNames.length]]),
];

const allNodes: Record<NodeName, Vec2> = { ...node, ...ringNodes };
const names = Object.keys(allNodes) as NodeName[];
const nodes: Vec2[] = names.map((n) => allNodes[n]);
const edges: [number, number][] = LINKS.map(([a, b]) => [names.indexOf(a), names.indexOf(b)]);

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
