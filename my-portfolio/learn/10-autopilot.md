# Episode 10: Autopilot, Path Finding and Steering

**Goal:** click a destination (or anywhere on the square) and the car plans the shortest route and drives itself there, keeping left and slowing down to park.

**New ideas:** graphs (nodes and edges), Dijkstra's algorithm, nearest point on a line segment, pure-pursuit steering, stopping distance `v² = 2ad`.

---

## Part 1: Roads as a graph (4 min)

**Show:** the top-down map with dots (nodes) at junctions and lines (edges) between them, avoiding the buildings.

**Say:**

> How does Google Maps find a route? It sees roads as a **graph**: **nodes** are junctions, **edges** are the roads between them, and each edge has a length.
>
> We do the same. I put dots at the corners of the square, the middle and each parking spot. Then I list which dots connect with a straight line that doesn't hit a building. Those are our edges.
>
> To find the shortest route we use **Dijkstra's algorithm**. It's from 1956 and it's still everywhere.

**Explain Dijkstra simply (animate it on the graph):**

> Start at the beginning, at distance 0. Every other node starts at "infinity". Then repeat:
>
> 1. Pick the closest node you haven't finished yet.
> 2. Look at its neighbours. If going through this node gives a neighbour a shorter distance than it had, write the new distance down, and remember we came from here.
> 3. Mark this node finished.
>
> When you finish the destination, stop. Then follow the "came from" notes backwards, and that's your route.
>
> It's like water spreading through pipes from the start: it reaches every junction by the shortest way first.

## Part 2: The path graph and planner (8 min)

Add the path graph to the end of `src/components/world/map.ts`. Here is the whole file now; the new part starts at the `The path graph the autopilot follows` comment:

```ts
// The world's map, as plain data and maths (no React, no three.js).
//
// Coordinates are [x, z] on the ground, in metres. -z is north. The paved
// square runs from -38 to 38 both ways; houses line its north, west and south
// sides, and a lake lies to the east.

import type { SectionId } from "@/config/profile";

export type Vec2 = [number, number];
export type Rect = [minX: number, maxX: number, minZ: number, maxZ: number];

/** Where the car can drive. */
export const PAVED: Rect = [-38, 38, -38, 38];

/** The car starts in the middle of the square, facing north (towards the pagoda). */
export const START = { x: 0, z: 10, heading: Math.PI };

/** Keep to the left of the path while driving, as in Nepal. */
export const LANE_OFFSET = 1.2;

export const LAKE = { center: [62, 10] as Vec2, radius: 16 };

export interface Destination {
  id: SectionId;
  /** The landmark's name, shown under the section title. */
  place: string;
  color: string;
  /** Where the car parks. */
  spot: Vec2;
  /** The landmark's centre: its sign floats above it. */
  center: Vec2;
  signHeight: number;
}

export const destinations: Destination[] = [
  { id: "about", place: "Newa Home", color: "#e07a5f", spot: [-14, 20], center: [-24, 20], signHeight: 12 },
  { id: "projects", place: "Pagoda Temple", color: "#2a9d8f", spot: [0, -14], center: [0, -28], signHeight: 22 },
  { id: "contact", place: "Phewa Lake", color: "#d64545", spot: [33, 8], center: LAKE.center, signHeight: 5 },
];

export const destinationById = Object.fromEntries(destinations.map((d) => [d.id, d])) as Record<SectionId, Destination>;

/** Anything the car bumps into and the camera keeps out of: a box on the ground. */
export interface Solid {
  center: Vec2;
  size: Vec2;
  height: number;
}

export const LANDMARKS = {
  pagoda: { center: [0, -28], size: [12, 12], height: 20 },
  home: { center: [-24, 20], size: [8, 10], height: 9 },
} satisfies Record<string, Solid>;

/** Pseudo-random numbers from a seed, so the town looks the same on every visit. */
export function seeded(seed: number) {
  return () => (seed = (seed * 16807) % 2147483647) / 2147483647;
}

export interface House extends Solid {
  wall: string;
  roof: string;
}

const WALLS = ["#9c4630", "#a34d35", "#8f3f2b", "#e9dcc4", "#e2cfb0"];
const ROOFS = ["#5e3426", "#6b3a2a", "#57301f"];

/** Rows of houses just outside the paving, on the north, west and south sides. */
function buildHouses() {
  const rand = seeded(7);
  const houses: House[] = [];

  // Fill the line from `from` to `to` with houses of random width.
  const row = (from: Vec2, to: Vec2) => {
    const length = Math.hypot(to[0] - from[0], to[1] - from[1]);
    const dx = (to[0] - from[0]) / length;
    const dz = (to[1] - from[1]) / length;
    for (let s = 0; ; ) {
      const width = 5 + rand() * 3;
      if (s + width > length) break;
      const middle = s + width / 2;
      houses.push({
        center: [from[0] + dx * middle, from[1] + dz * middle],
        // Width runs along the row, depth (6 m) away from the square.
        size: dx !== 0 ? [width - 0.3, 6] : [6, width - 0.3],
        height: 5 + Math.floor(rand() * 3) * 2.4,
        wall: WALLS[Math.floor(rand() * WALLS.length)],
        roof: ROOFS[Math.floor(rand() * ROOFS.length)],
      });
      s += width;
    }
  };

  row([-42, -42], [42, -42]); // north
  row([-42, -36], [-42, 42]); // west
  row([-36, 42], [42, 42]); // south
  return houses;
}

export const houses = buildHouses();

export const solids: Solid[] = [...Object.values(LANDMARKS), ...houses];

/** True if (x, z) is on the paving, at least `margin` from every solid. */
export function isOpen(x: number, z: number, margin = 1) {
  const [x0, x1, z0, z1] = PAVED;
  if (x < x0 + margin || x > x1 - margin || z < z0 + margin || z > z1 - margin) return false;
  return !solids.some(
    (s) => Math.abs(x - s.center[0]) < s.size[0] / 2 + margin && Math.abs(z - s.center[1]) < s.size[1] / 2 + margin,
  );
}

// ---------------------------------------------------------------------------
// The path graph the autopilot follows
// ---------------------------------------------------------------------------

const node = {
  nw: [-33, -14],
  n: destinationById.projects.spot,
  ne: [33, -14],
  w: [-33, 8],
  c: [0, 8],
  e: destinationById.contact.spot,
  sw: [-33, 32],
  s: [0, 32],
  se: [33, 32],
  about: destinationById.about.spot,
} satisfies Record<string, Vec2>;

type NodeName = keyof typeof node;

/** Straight lines between nodes that don't pass through any building. */
const LINKS: [NodeName, NodeName][] = [
  ["nw", "n"], ["n", "ne"], ["nw", "w"], ["ne", "e"],
  ["w", "c"], ["c", "e"], ["c", "n"], ["c", "s"],
  ["w", "sw"], ["sw", "s"], ["s", "se"], ["se", "e"],
  ["c", "about"], ["s", "about"],
];

const names = Object.keys(node) as NodeName[];
const nodes: Vec2[] = names.map((n) => node[n]);
const edges: [number, number][] = LINKS.map(([a, b]) => [names.indexOf(a), names.indexOf(b)]);

const dist = (a: Vec2, b: Vec2) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/** The closest point to `p` on any path, and the edge it lies on. */
function nearestOnPaths(p: Vec2) {
  let best = { point: nodes[0], edge: edges[0], d: Infinity };
  for (const edge of edges) {
    const [a, b] = [nodes[edge[0]], nodes[edge[1]]];
    const abx = b[0] - a[0];
    const abz = b[1] - a[1];
    // How far along a→b the closest point is (0 = at a, 1 = at b).
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * abx + (p[1] - a[1]) * abz) / (abx * abx + abz * abz)));
    const point: Vec2 = [a[0] + abx * t, a[1] + abz * t];
    const d = dist(p, point);
    if (d < best.d) best = { point, edge, d };
  }
  return best;
}

/** The shortest way along the paths from `from` to the path point nearest `to` (Dijkstra). */
export function planRoute(from: Vec2, to: Vec2): Vec2[] {
  const start = nearestOnPaths(from);
  const end = nearestOnPaths(to);

  // The graph's nodes, plus two temporary ones: S where we join it, T where we leave it.
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
    // Visit the closest node we haven't finished yet.
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

  // Walk back from T to S to read the route out.
  const path: Vec2[] = [];
  for (let at = T; at >= 0; at = previous[at]) path.unshift(points[at]);
  return [from, ...path].filter((p, i, all) => i === 0 || dist(p, all[i - 1]) > 0.05);
}
```

**Line by line (the new part):**

- `node` names every junction. Three of them **are** the parking spots, so routes end exactly there.
- `LINKS` lists the edges by name. Easy to read, easy to fix. We turn names into array indices for speed (`nodes` and `edges`).
- **`nearestOnPaths(p)`:** you can click anywhere, not just on a node. So we find the closest point on any edge.

**Nearest point on a segment (show the projection drawing):**

> For a segment from A to B and a point P, we "project" P onto the line: `t = (AP · AB) / |AB|²`. The dot product measures how far along AB the point P is. `t = 0` is at A, `t = 1` at B. We clamp `t` between 0 and 1 to stay on the segment, and the closest point is `A + AB × t`. The car's route code uses the same trick.

- **`planRoute(from, to)`:**
  - Adds two temporary nodes: **S**, where we join the paths (nearest to the car), and **T**, where we leave them (nearest to the target). Each is linked to the two ends of its edge.
  - Builds an **adjacency list**: for each node, its neighbours and distances.
  - Runs Dijkstra exactly as explained: `best` holds distances, `previous` the came-from notes, `done` the finished nodes.
  - Walks back from T through `previous` to build the path, starting with the car's position.
  - The final `filter` drops points that are practically on top of each other.

> For a small graph, finding the closest node with a simple loop is fine. Big maps use a "priority queue", and **A\*** adds a guess of the remaining distance to search fewer nodes. Red Blob Games explains both beautifully; the link is in the description.

## Part 3: Following the route, pure pursuit (8 min)

**Show:** the route line, the car, and a point a few metres ahead on the route. A circular arc from the car through that point.

**Say:**

> Now the car has a list of points. How does it follow them smoothly? A method from robotics called **pure pursuit**: pick a point a few metres **ahead** on the route, a "carrot on a stick", and steer towards it. The car drives a smooth arc onto the path and chases the carrot round corners.
>
> Faster means a further carrot (up to 8 m). Otherwise it zigzags at speed.

Here is the final `Car.tsx`. The new parts are the `Route` class, picking up drive requests, and the autopilot branch:

```tsx
"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import type { SectionId } from "@/config/profile";
import { destinationById, destinations, LANE_OFFSET, PAVED, planRoute, solids, type Vec2 } from "./map";
import { Box, mat } from "./parts";
import { car, takeDriveRequest, worldStore } from "./store";

// How the car handles
const WHEELBASE = 2.5; // distance between the axles: shorter turns tighter
const RADIUS = 1.4; // size for bumping into things
const MAX_SPEED = 16;
const MAX_REVERSE = 6;
const MAX_STEER = 0.55; // radians
const ACCEL = 13;
const BRAKE = 28;
const DRAG = 3.5;
// Parking within this distance of a spot (and slowly) opens its panel.
const PARK_RADIUS = 4;
const LEAVE_RADIUS = 6.5;

const clamp = THREE.MathUtils.clamp;
/** An angle brought into -π..π, so "turn 350° left" becomes "turn 10° right". */
const wrapAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
/** Move `value` towards `target` by at most `step`. */
const approach = (value: number, target: number, step: number) =>
  value < target ? Math.min(value + step, target) : Math.max(value - step, target);

/** The keys held down right now, by `KeyboardEvent.code` ("KeyW", "ArrowUp"...). */
function useKeys() {
  const keys = useRef(new Set<string>());

  useEffect(() => {
    const pressed = keys.current;
    const down = (e: KeyboardEvent) => {
      pressed.add(e.code);
      if (e.code === "Space") e.preventDefault(); // don't scroll the page
    };
    const up = (e: KeyboardEvent) => pressed.delete(e.code);
    const clear = () => pressed.clear(); // the window lost focus: let go of everything
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
    };
  }, []);

  return keys;
}

/** A route the autopilot follows, and how far along it the car has got. */
class Route {
  readonly cum: number[] = [0]; // distance from the start to each point
  readonly length: number;
  s = 0; // how far along we are

  constructor(
    readonly points: Vec2[],
    readonly destination: SectionId | null,
  ) {
    for (let i = 1; i < points.length; i++) {
      const [a, b] = [points[i - 1], points[i]];
      this.cum.push(this.cum[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1]));
    }
    this.length = this.cum[this.cum.length - 1];
  }

  /** Move `s` forward to the point on the route closest to the car. */
  update(x: number, z: number) {
    for (let i = 0; i < this.points.length - 1; i++) {
      const [a, b] = [this.points[i], this.points[i + 1]];
      const abx = b[0] - a[0];
      const abz = b[1] - a[1];
      const lengthSq = abx * abx + abz * abz || 1;
      const t = clamp(((x - a[0]) * abx + (z - a[1]) * abz) / lengthSq, 0, 1);
      const d = Math.hypot(a[0] + abx * t - x, a[1] + abz * t - z);
      const s = this.cum[i] + t * Math.sqrt(lengthSq);
      // Only nearby points count, and we never go backwards.
      if (d < 4 && s > this.s && s < this.s + 6) this.s = s;
    }
  }

  /** The point `s` metres along the route, moved to the left lane. */
  pointAt(s: number, out: THREE.Vector2) {
    let i = 0;
    while (i < this.cum.length - 2 && this.cum[i + 1] < s) i++;
    const [a, b] = [this.points[i], this.points[i + 1]];
    const span = this.cum[i + 1] - this.cum[i] || 1;
    const t = (s - this.cum[i]) / span; // past the end, this carries on in a straight line
    const dx = (b[0] - a[0]) / span;
    const dz = (b[1] - a[1]) / span;
    // Left of the direction of travel is (dz, -dx).
    return out.set(a[0] + (b[0] - a[0]) * t + dz * LANE_OFFSET, a[1] + (b[1] - a[1]) * t - dx * LANE_OFFSET);
  }
}

/** Push the car out of every building, and keep it on the paving. Returns true if it hit something. */
function collide() {
  let hit = false;
  for (const { center, size } of solids) {
    // The closest point of the box to the car...
    const cx = clamp(car.x, center[0] - size[0] / 2, center[0] + size[0] / 2);
    const cz = clamp(car.z, center[1] - size[1] / 2, center[1] + size[1] / 2);
    const dx = car.x - cx;
    const dz = car.z - cz;
    const d = Math.hypot(dx, dz);
    // ...is too close: push the car straight away from it.
    if (d < RADIUS && d > 1e-4) {
      car.x = cx + (dx / d) * RADIUS;
      car.z = cz + (dz / d) * RADIUS;
      hit = true;
    }
  }
  const [x0, x1, z0, z1] = PAVED;
  const x = clamp(car.x, x0 + RADIUS, x1 - RADIUS);
  const z = clamp(car.z, z0 + RADIUS, z1 - RADIUS);
  if (x !== car.x || z !== car.z) hit = true;
  car.x = x;
  car.z = z;
  return hit;
}

function nearestDestination() {
  let best: SectionId | null = null;
  let bestDistance = Infinity;
  for (const d of destinations) {
    const distance = Math.hypot(car.x - d.spot[0], car.z - d.spot[1]);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = d.id;
    }
  }
  return { id: best, distance: bestDistance };
}

/** A wheel at (x, z) under the car. Front wheels turn with the steering. */
const WHEELS = [
  { x: -0.85, z: 1.25, front: true },
  { x: 0.85, z: 1.25, front: true },
  { x: -0.85, z: -1.25, front: false },
  { x: 0.85, z: -1.25, front: false },
];
const WHEEL_RADIUS = 0.36;

/**
 * The visitor's car. WASD / arrow keys drive it, Space brakes. A click on a
 * destination (or the ground) starts the autopilot, which follows the paths.
 */
export default function Car() {
  const root = useRef<THREE.Group>(null!);
  const spinners = useRef<(THREE.Group | null)[]>([]);
  const pivots = useRef<(THREE.Group | null)[]>([]);
  const keys = useKeys();
  const route = useRef<Route | null>(null);
  const target = useRef(new THREE.Vector2());
  const stuck = useRef(0);

  useFrame((_, rawDelta) => {
    // A long pause (switching tabs) shouldn't send the car flying.
    const dt = Math.min(rawDelta, 1 / 30);
    const k = keys.current;

    // 1. Pick up a new destination from the HUD, a sign or a click.
    const request = takeDriveRequest();
    if (request === "stop") {
      route.current = null;
      worldStore.set({ driving: null });
    } else if (request) {
      route.current = new Route(planRoute([car.x, car.z], request.target), request.destination);
      stuck.current = 0;
      worldStore.set({ driving: request.destination ?? "point", active: null, dismissed: null });
    }

    // 2. Keyboard. Any key takes the wheel back from the autopilot.
    const throttle = (k.has("KeyW") || k.has("ArrowUp") ? 1 : 0) - (k.has("KeyS") || k.has("ArrowDown") ? 1 : 0);
    const steerInput = (k.has("KeyA") || k.has("ArrowLeft") ? 1 : 0) - (k.has("KeyD") || k.has("ArrowRight") ? 1 : 0);
    const braking = k.has("Space");
    if ((throttle || steerInput || braking) && route.current) {
      route.current = null;
      worldStore.set({ driving: null });
    }

    let targetSteer = 0;
    const r = route.current;

    if (r) {
      // 3a. Autopilot ("pure pursuit"): steer towards a point a little way ahead on the route.
      r.update(car.x, car.z);
      const remaining = r.length - r.s;
      const lookahead = clamp(3.5 + Math.abs(car.speed) * 0.35, 3.5, 8);
      const aim = r.pointAt(r.s + lookahead, target.current);
      const dx = aim.x - car.x;
      const dz = aim.y - car.z;
      // The angle between where we're facing and where the aim point is.
      const alpha = wrapAngle(Math.atan2(dx, dz) - car.heading);
      // Aim point behind us? Turn round at full lock. Otherwise steer just enough to reach it.
      targetSteer =
        Math.abs(alpha) > Math.PI / 2
          ? Math.sign(alpha) * MAX_STEER
          : clamp(Math.atan2(2 * WHEELBASE * Math.sin(alpha), Math.hypot(dx, dz)), -MAX_STEER, MAX_STEER);

      // Slow down in time to stop at the end (v² = 2·a·d), and for sharp turns.
      let wanted = Math.min(MAX_SPEED, Math.sqrt(2 * 12 * Math.max(remaining - 0.4, 0)));
      wanted *= clamp(1 - Math.abs(alpha) / 1.4, 0.3, 1);
      car.speed = approach(car.speed, wanted, (wanted > car.speed ? ACCEL : BRAKE) * dt);

      // Arrived (or wedged against something for 2.5 s): hand back control.
      stuck.current = Math.abs(car.speed) < 0.4 ? stuck.current + dt : 0;
      if ((remaining < 0.8 && Math.abs(car.speed) < 1.5) || stuck.current > 2.5) {
        route.current = null;
        car.speed = 0;
        worldStore.set({ driving: null, active: stuck.current > 2.5 ? null : r.destination, dismissed: null });
      }
    } else {
      // 3b. Driving by hand. Steering gets gentler at speed.
      targetSteer = steerInput * MAX_STEER * (1 - 0.45 * Math.min(Math.abs(car.speed) / MAX_SPEED, 1));
      if (throttle > 0) car.speed += (car.speed < 0 ? BRAKE : ACCEL) * dt;
      else if (throttle < 0) car.speed -= (car.speed > 0 ? BRAKE : ACCEL * 0.6) * dt;
      else car.speed = approach(car.speed, 0, DRAG * dt);
      if (braking) car.speed = approach(car.speed, 0, BRAKE * 1.2 * dt);
      car.speed = clamp(car.speed, -MAX_REVERSE, MAX_SPEED);

      // Stopping near a destination opens its panel; driving away closes it.
      const near = nearestDestination();
      const { active } = worldStore.get();
      if (near.id && near.distance < PARK_RADIUS && Math.abs(car.speed) < 3 && active !== near.id) {
        worldStore.set({ active: near.id, dismissed: null });
      } else if (active) {
        const spot = destinationById[active].spot;
        if (Math.hypot(car.x - spot[0], car.z - spot[1]) > LEAVE_RADIUS) worldStore.set({ active: null, dismissed: null });
      }
    }

    // 4. Move: the "bicycle model". Turning rate = speed / wheelbase × tan(steering angle).
    car.steer = THREE.MathUtils.damp(car.steer, targetSteer, 10, dt);
    car.heading += (car.speed / WHEELBASE) * Math.tan(car.steer) * dt;
    car.x += Math.sin(car.heading) * car.speed * dt;
    car.z += Math.cos(car.heading) * car.speed * dt;
    if (collide()) car.speed *= 1 - Math.min(1, 5 * dt); // scrape to a halt

    // 5. Show it: move the model, spin the wheels, turn the front ones.
    root.current.position.set(car.x, 0, car.z);
    root.current.rotation.y = car.heading;
    car.travelled += car.speed * dt;
    spinners.current.forEach((wheel) => {
      if (wheel) wheel.rotation.x = car.travelled / WHEEL_RADIUS;
    });
    pivots.current.forEach((pivot) => {
      if (pivot) pivot.rotation.y = car.steer;
    });
  });

  return (
    // The model faces +z. Its group is moved and turned every frame above.
    <group ref={root}>
      <Box size={[1.7, 0.7, 3.8]} position={[0, 0.75, 0]} color="#d64545" />
      <Box size={[1.5, 0.6, 2]} position={[0, 1.4, -0.3]} color="#f3efe6" />
      <Box size={[1.4, 0.45, 0.05]} position={[0, 1.42, 0.71]} color="#3a4a5c" />

      {WHEELS.map((w, i) => (
        // Pivot (turns with the steering) > spinner (rolls) > tyre
        <group
          key={i}
          position={[w.x, WHEEL_RADIUS, w.z]}
          ref={(el) => {
            pivots.current[i] = w.front ? el : null;
          }}
        >
          <group
            ref={(el) => {
              spinners.current[i] = el;
            }}
          >
            <mesh rotation-z={Math.PI / 2} material={mat("#22252b", 0.9)} castShadow>
              <cylinderGeometry args={[WHEEL_RADIUS, WHEEL_RADIUS, 0.28, 16]} />
            </mesh>
            {/* A hub bar, so you can see the wheel turn */}
            <Box size={[0.3, WHEEL_RADIUS * 1.4, 0.08]} position={[0, 0, 0]} color="#d7dce2" />
          </group>
        </group>
      ))}
    </group>
  );
}
```

**Line by line, `Route`:**

- `cum[i]` is the distance from the start to point `i`, so we can talk about "12 metres along the route".
- `update(x, z)` moves our progress `s` forward to the nearest point on the route, using the same projection trick. Two rules keep it stable: only points close to the car (within 4 m) count, and progress never goes backwards or jumps more than 6 m.
- `pointAt(s)` is the point `s` metres along, moved **left** by `LANE_OFFSET`. For a direction (dx, dz), left is (dz, −dx): the direction turned 90°. That's how the car keeps to the left lane like in Nepal. Past the end, it carries on straight, so the carrot never sits on top of the car.

**Line by line, `useFrame`:**

1. **Requests:** `takeDriveRequest()` empties the mailbox from episode 6. A new target plans a route; `"stop"` cancels.
2. **Any key cancels the autopilot**: the visitor takes the wheel back.
3. **Autopilot:**
   - `alpha` is the angle between where we face and where the carrot is (`atan2` of the difference, wrapped).
   - The steering formula `atan2(2 × wheelbase × sin(alpha), distance)` is the pure-pursuit formula: the steering angle for the arc that passes through the carrot.
   - If the carrot is **behind** us (|alpha| > 90°), turn at full lock to come round.
   - **Speed:** to stop in time, the speed must be at most `√(2 × braking × distance left)`. That comes from the physics formula **v² = 2ad**. The car slows down smoothly and stops right at the spot. It also slows down for sharp turns.
   - **Arrived** (less than 0.8 m left, nearly stopped) means stop, and set `active`, which opens the panel. **Stuck** (blocked for 2.5 s) means give up and hand back control.

## Part 4: Buttons, keys and clicking the ground (4 min)

In `Ground.tsx`, make the square clickable:

```tsx
"use client";

import { useMemo } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";

import { PAVED } from "./map";
import { driveToPoint } from "./store";

/** Brick paving drawn once into a canvas, then used as a repeating texture. */
function useBrickTexture(repeatX: number, repeatZ: number) {
  return useMemo(() => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#7e4a35"; // mortar
    ctx.fillRect(0, 0, size, size);

    const colors = ["#ad6244", "#a2583c", "#b66d4d", "#9b5237"];
    let seed = 11;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const w = 64;
    const h = 32;
    for (let row = 0; row < size / h; row++) {
      // Every other row starts half a brick along: a "running bond".
      const offset = row % 2 ? w / 2 : 0;
      for (let x = -w; x < size + w; x += w) {
        ctx.fillStyle = colors[Math.floor(rand() * colors.length)];
        ctx.fillRect(x + offset + 2, row * h + 2, w - 4, h - 4);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeatX, repeatZ);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8; // stays sharp when seen at a low angle
    return texture;
  }, [repeatX, repeatZ]);
}

/** Grass everywhere, and the brick square. Clicking the square drives there. */
export default function Ground() {
  const [x0, x1, z0, z1] = PAVED;
  const width = x1 - x0;
  const depth = z1 - z0;
  // One texture repeat every 3 metres.
  const bricks = useBrickTexture(width / 3, depth / 3);

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    driveToPoint(e.point.x, e.point.z);
  };

  return (
    <>
      {/* A little lower than the paving, so the two never flicker ("z-fighting"). */}
      <mesh rotation-x={-Math.PI / 2} position-y={-0.05} receiveShadow>
        <planeGeometry args={[800, 800]} />
        <meshStandardMaterial color="#a3b974" />
      </mesh>

      <mesh rotation-x={-Math.PI / 2} position={[(x0 + x1) / 2, 0, (z0 + z1) / 2]} receiveShadow onClick={onClick}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial map={bricks} roughness={0.95} />
      </mesh>
    </>
  );
}
```

> R3F gives 3D meshes mouse events like HTML: `onClick` on the mesh, with `e.point`, the exact 3D point you clicked. `stopPropagation` stops the click also hitting things behind.

In `Hud.tsx`, add a status pill and a destination bar:

```tsx
"use client";

import { useEffect } from "react";

import SectionContent from "@/components/SectionContent";
import { profile, sections } from "@/config/profile";
import { destinationById, destinations } from "./map";
import { driveTo, stopDriving, useWorld, worldStore } from "./store";

/** The section's card, open while the car is parked at its landmark. */
function Panel() {
  const active = useWorld((s) => s.active);
  const dismissed = useWorld((s) => s.dismissed);
  if (!active || active === dismissed) return null;
  const d = destinationById[active];

  return (
    <aside
      aria-label={sections[active].title}
      className="pointer-events-auto absolute inset-x-2 bottom-20 max-h-[50vh] overflow-y-auto rounded-3xl bg-white p-5 shadow-xl sm:inset-x-auto sm:bottom-auto sm:right-5 sm:top-20 sm:w-[400px]"
    >
      <div className="mb-3 flex items-center gap-3">
        <span className="size-8 rounded-xl" style={{ background: d.color }} />
        <div className="flex-1">
          <p className="text-xs text-neutral-500">{d.place}</p>
          <h2 className="text-lg font-semibold">{sections[active].title}</h2>
        </div>
        <button
          type="button"
          onClick={() => worldStore.set({ dismissed: active })}
          aria-label="Close"
          className="rounded-full px-2 py-1 text-neutral-500 hover:bg-neutral-100"
        >
          ✕
        </button>
      </div>
      <SectionContent id={active} />
    </aside>
  );
}

/** "Driving to Projects", with a stop button, while the autopilot is on. */
function DrivingStatus() {
  const driving = useWorld((s) => s.driving);
  if (!driving) return null;
  return (
    <div className="pointer-events-auto absolute left-1/2 top-5 flex -translate-x-1/2 items-center gap-3 rounded-full bg-white/95 py-1.5 pl-4 pr-1.5 text-sm shadow-md">
      Driving to <b>{driving === "point" ? "your pin" : sections[driving].title}</b>
      <button type="button" onClick={stopDriving} className="rounded-full px-3 py-1 hover:bg-neutral-100">
        Stop
      </button>
    </div>
  );
}

/** Everything drawn on top of the 3D world. */
export default function Hud({ onExit }: { onExit: () => void }) {
  // Keyboard shortcuts: 1-3 drive to a place, Esc closes the panel.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (n >= 1 && n <= destinations.length) driveTo(destinations[n - 1].id);
      const { active } = worldStore.get();
      if (e.key === "Escape" && active) worldStore.set({ dismissed: active });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    // pointer-events-none lets clicks fall through to the 3D scene, except on
    // the parts that turn them back on with pointer-events-auto.
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute left-5 top-5 rounded-2xl bg-white/90 px-4 py-2.5 shadow-sm">
        <p className="font-semibold">{profile.name}</p>
        <p className="text-sm text-neutral-500">{profile.role}</p>
      </div>

      <button
        type="button"
        onClick={onExit}
        className="pointer-events-auto absolute right-5 top-5 rounded-full bg-white/90 px-4 py-2 text-sm font-medium shadow-sm hover:bg-white"
      >
        Classic view
      </button>

      <DrivingStatus />

      {/* Where to? One button per destination. */}
      <nav aria-label="Destinations" className="pointer-events-auto absolute inset-x-0 bottom-4 mx-auto flex w-fit gap-2 rounded-full bg-white/90 p-1.5 shadow-md">
        {destinations.map((d, i) => (
          <button
            key={d.id}
            type="button"
            onClick={(e) => {
              driveTo(d.id);
              e.currentTarget.blur(); // so Space brakes instead of pressing this button again
            }}
            className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm hover:bg-neutral-100"
          >
            <span className="size-3 rounded-full" style={{ background: d.color }} />
            {sections[d.id].title}
            <kbd className="text-xs text-neutral-400 max-sm:hidden">{i + 1}</kbd>
          </button>
        ))}
      </nav>

      <Panel />
    </div>
  );
}
```

**Say:**

> The destination bar has one button per place. They call `driveTo`, which leaves a note for the car. Keys 1, 2 and 3 do the same.
>
> One small detail: after clicking a button we call `blur()`. Otherwise the button keeps keyboard focus, and pressing Space to brake would click it again!

## Checkpoint

- Click **Projects**: the car plans a route, drives on the left, slows down and parks. The panel opens.
- Press 1, 2, 3 to hop between places. Click anywhere on the square to drive there.
- Press any arrow key mid-route: you take control back.

## Common mistakes

| Problem | Fix |
| --- | --- |
| Car circles the end point forever | `pointAt` must carry on past the end, and arrival must allow a little distance (0.8 m). |
| Car cuts through a building | An edge in `LINKS` passes through it. Draw your graph on paper first. |
| Car drives on the right | Left of (dx, dz) is (dz, −dx); check the signs. |
| Space re-clicks a button | Call `e.currentTarget.blur()` after the click. |

## Say (outro)

> That's real path finding, the same idea as in games and maps. Next time we make the town easier to explore: floating signs over each landmark, and a minimap.
