# Final Code

Every file of the finished project, exactly as built in the series. Use it to compare your code when something doesn't work.

Install first (episode 1):

```bash
pnpm create next-app@latest my-3d-portfolio --yes --src-dir
cd my-3d-portfolio
pnpm add three @react-three/fiber @react-three/drei
pnpm add -D @types/three
```

Then create or replace these files. (`@react-three/drei` is only needed for `OrbitControls` in episodes 2–7; you can remove it at the end.)

## Contents

- [src/app/layout.tsx](#srcapplayouttsx)
- [src/app/globals.css](#srcappglobalscss)
- [src/app/page.tsx](#srcapppagetsx)
- [src/config/profile.ts](#srcconfigprofilets)
- [src/components/SectionContent.tsx](#srccomponentssectioncontenttsx)
- [src/components/ViewSwitch.tsx](#srccomponentsviewswitchtsx)
- [src/components/world/World.tsx](#srccomponentsworldworldtsx)
- [src/components/world/Scene.tsx](#srccomponentsworldscenetsx)
- [src/components/world/map.ts](#srccomponentsworldmapts)
- [src/components/world/store.ts](#srccomponentsworldstorets)
- [src/components/world/parts.tsx](#srccomponentsworldpartstsx)
- [src/components/world/Ground.tsx](#srccomponentsworldgroundtsx)
- [src/components/world/Buildings.tsx](#srccomponentsworldbuildingstsx)
- [src/components/world/Houses.tsx](#srccomponentsworldhousestsx)
- [src/components/world/Car.tsx](#srccomponentsworldcartsx)
- [src/components/world/CameraRig.tsx](#srccomponentsworldcamerarigtsx)
- [src/components/world/Lake.tsx](#srccomponentsworldlaketsx)
- [src/components/world/People.tsx](#srccomponentsworldpeopletsx)
- [src/components/world/Signs.tsx](#srccomponentsworldsignstsx)
- [src/components/world/Minimap.tsx](#srccomponentsworldminimaptsx)
- [src/components/world/Hud.tsx](#srccomponentsworldhudtsx)
- [src/components/world/engine.ts](#srccomponentsworldenginets)
- [src/components/world/Sound.tsx](#srccomponentsworldsoundtsx)

## src/app/layout.tsx

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "My 3D Portfolio",
  description: "Drive around a small Nepali town to read my portfolio.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

## src/app/globals.css

```css
@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #171717;
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: Arial, Helvetica, sans-serif;
}
```

## src/app/page.tsx

```tsx
import SectionContent from "@/components/SectionContent";
import ViewSwitch from "@/components/ViewSwitch";
import { profile, sections, type SectionId } from "@/config/profile";

export default function Home() {
  const ids = Object.keys(sections) as SectionId[];

  return (
    // The 3D world is shown on top; this plain page is always underneath it.
    <ViewSwitch>
      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-4xl font-bold">{profile.name}</h1>
        <p className="mt-2 text-lg text-neutral-600">{profile.role}</p>

        {ids.map((id) => (
          <section key={id} id={id} className="mt-12">
            <h2 className="mb-3 text-2xl font-semibold">{sections[id].title}</h2>
            <SectionContent id={id} />
          </section>
        ))}
      </main>
    </ViewSwitch>
  );
}
```

## src/config/profile.ts

```ts
// All the portfolio's words live here. The 3D panels and the classic page
// both read this file, so you only ever edit text in one place.

export type SectionId = "about" | "projects" | "contact";

export const profile = {
  name: "Your Name",
  role: "Backend Engineer",
};

export const sections: Record<SectionId, { title: string; lines: string[] }> = {
  about: {
    title: "About me",
    lines: [
      "I build backend systems with C#, .NET and PostgreSQL.",
      "I live in Bhaktapur, Nepal, and I love explaining how things work.",
    ],
  },
  projects: {
    title: "Projects",
    lines: [
      "Order service: an event-driven API with Kafka and Redis.",
      "This website: a small 3D town built with React Three Fiber.",
    ],
  },
  contact: {
    title: "Contact",
    lines: ["Email: you@example.com", "GitHub: github.com/your-name"],
  },
};
```

## src/components/SectionContent.tsx

```tsx
import { sections, type SectionId } from "@/config/profile";

/** One section's text. Used by the classic page and by the 3D panel. */
export default function SectionContent({ id }: { id: SectionId }) {
  return (
    <ul className="space-y-2">
      {sections[id].lines.map((line) => (
        <li key={line} className="leading-relaxed">
          {line}
        </li>
      ))}
    </ul>
  );
}
```

## src/components/ViewSwitch.tsx

```tsx
"use client";

import { useEffect, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";

// three.js only works in the browser, so the world loads client-side only,
// in its own chunk. While it downloads we show a plain background.
const World = dynamic(() => import("@/components/world/World"), {
  ssr: false,
  loading: () => <div className="fixed inset-0 z-50 bg-[#efe6d6]" />,
});

/** Shows the 3D world over the classic page, with a button to switch between them. */
export default function ViewSwitch({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<"world" | "classic">("world");

  // While the world covers the page, stop the page underneath from scrolling.
  useEffect(() => {
    if (mode !== "world") return;
    const { style } = document.documentElement;
    style.overflow = "hidden";
    return () => {
      style.overflow = "";
    };
  }, [mode]);

  return (
    <>
      {mode === "world" && <World onExit={() => setMode("classic")} />}

      {/* `inert` makes the hidden page unclickable and skipped by Tab. */}
      <div inert={mode === "world"}>{children}</div>

      {mode === "classic" && (
        <button
          type="button"
          onClick={() => setMode("world")}
          className="fixed right-4 top-4 rounded-full border bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-neutral-100"
        >
          Back to 3D
        </button>
      )}
    </>
  );
}
```

## src/components/world/World.tsx

```tsx
"use client";

import { Canvas } from "@react-three/fiber";

import Hud from "./Hud";
import Scene from "./Scene";
import { Signs } from "./Signs";

/** The 3D world: the canvas, and the HTML layers on top of it. */
export default function World({ onExit }: { onExit: () => void }) {
  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#efe6d6]">
      <Canvas
        shadows
        flat
        dpr={[1, 1.75]}
        camera={{ position: [0, 30, 60], fov: 52, near: 0.5, far: 600 }}
      >
        <Scene />
      </Canvas>

      <Signs />
      <Hud onExit={onExit} />
    </div>
  );
}
```

## src/components/world/Scene.tsx

```tsx
"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import Buildings from "./Buildings";
import CameraRig from "./CameraRig";
import Car from "./Car";
import Ground from "./Ground";
import Houses from "./Houses";
import Lake from "./Lake";
import People from "./People";
import { SignTracker } from "./Signs";
import Sound from "./Sound";
import { car } from "./store";

const HAZE = "#efe6d6";

/**
 * The sun. Shadows are only drawn inside a box round the light's target, so
 * the light (and its box) follows the car: sharp shadows wherever you drive.
 */
function Sun() {
  const light = useRef<THREE.DirectionalLight>(null!);

  useFrame(() => {
    light.current.position.set(car.x - 30, 55, car.z + 35);
    light.current.target.position.set(car.x, 0, car.z);
    light.current.target.updateMatrixWorld();
  });

  return (
    <directionalLight
      ref={light}
      castShadow
      intensity={2.5}
      color="#ffe6c7"
      shadow-mapSize={[2048, 2048]}
      shadow-camera-left={-48}
      shadow-camera-right={48}
      shadow-camera-top={48}
      shadow-camera-bottom={-48}
      shadow-camera-near={10}
      shadow-camera-far={160}
      shadow-bias={-0.0004}
      shadow-normalBias={0.05}
    />
  );
}

export default function Scene() {
  return (
    <>
      <color attach="background" args={[HAZE]} />
      {/* Far things fade into the haze: it hides the edge of the world. */}
      <fog attach="fog" args={[HAZE, 70, 220]} />
      {/* Soft light from the sky above and the grass below */}
      <hemisphereLight args={["#e6eef6", "#a3b974", 1.45]} />
      <Sun />

      <Ground />
      <Houses />
      <Buildings />
      <Lake />
      <People />
      <Car />
      <CameraRig />
      <Sound />
      {/* After the camera rig, so the signs use this frame's camera */}
      <SignTracker />
    </>
  );
}
```

## src/components/world/map.ts

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

## src/components/world/store.ts

```ts
import { useSyncExternalStore } from "react";

import type { SectionId } from "@/config/profile";
import { destinationById, START, type Vec2 } from "./map";

// State shared by the 3D scene and the HTML on top of it.
//
// Things that change every frame (the car's position and speed) live in a
// plain mutable object, so they never re-render React. Things that change
// now and then (where the car is parked) go through a tiny store that React
// components can subscribe to.

export interface WorldState {
  /** The destination the car is parked at. Its panel is open unless dismissed. */
  active: SectionId | null;
  /** The destination whose panel the visitor closed. */
  dismissed: SectionId | null;
  /** Where the autopilot is heading, if anywhere. */
  driving: SectionId | "point" | null;
}

const initialState: WorldState = { active: null, dismissed: null, driving: null };

let state = initialState;
const listeners = new Set<() => void>();

export const worldStore = {
  get: () => state,
  set(patch: Partial<WorldState>) {
    const keys = Object.keys(patch) as (keyof WorldState)[];
    if (keys.every((k) => patch[k] === state[k])) return; // nothing changed
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener());
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

/** Read part of the store in a component; it re-renders only when that part changes. */
export function useWorld<T>(selector: (s: WorldState) => T): T {
  return useSyncExternalStore(
    worldStore.subscribe,
    () => selector(state),
    () => selector(initialState),
  );
}

/** The car, updated every frame by <Car>. Heading 0 faces +z (south). */
export const car = {
  x: START.x,
  z: START.z,
  heading: START.heading,
  speed: 0,
  steer: 0,
  /** Distance driven so far: spins the wheels. */
  travelled: 0,
};

// A drive request waits here until <Car> picks it up on its next frame.
type DriveRequest = { target: Vec2; destination: SectionId | null } | "stop";
let pending: DriveRequest | null = null;

/** Drive along the paths to a destination. */
export function driveTo(id: SectionId) {
  pending = { target: destinationById[id].spot, destination: id };
}

/** Drive along the paths to the point nearest (x, z). */
export function driveToPoint(x: number, z: number) {
  pending = { target: [x, z], destination: null };
}

export function stopDriving() {
  pending = "stop";
}

export function takeDriveRequest() {
  const request = pending;
  pending = null;
  return request;
}
```

## src/components/world/parts.tsx

```tsx
"use client";

import * as THREE from "three";

const cache = new Map<string, THREE.MeshStandardMaterial>();

/** One shared material per colour, so hundreds of meshes reuse a handful. */
export function mat(color: string, roughness = 0.85) {
  const key = `${color}|${roughness}`;
  let material = cache.get(key);
  if (!material) {
    material = new THREE.MeshStandardMaterial({ color, roughness });
    cache.set(key, material);
  }
  return material;
}

type V3 = [number, number, number];

/** A box that casts and receives shadows. */
export function Box({ size, position, color }: { size: V3; position: V3; color: string }) {
  return (
    <mesh position={position} material={mat(color)} castShadow receiveShadow>
      <boxGeometry args={size} />
    </mesh>
  );
}

/**
 * A square roof tier: wide at the bottom, narrow at the top. It's a cylinder
 * with 4 sides, turned 45° so its sides line up with the x and z axes.
 * `bottom` and `top` are side lengths; `y` is where its base sits.
 */
export function Roof({ bottom, top, height, y, color }: { bottom: number; top: number; height: number; y: number; color: string }) {
  // A square's corner is (side / 2) * √2 from its centre: that's the cylinder's radius.
  const k = Math.SQRT1_2;
  return (
    <mesh position-y={y + height / 2} rotation-y={Math.PI / 4} material={mat(color)} castShadow receiveShadow>
      <cylinderGeometry args={[top * k, bottom * k, height, 4]} />
    </mesh>
  );
}
```

## src/components/world/Ground.tsx

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

## src/components/world/Buildings.tsx

```tsx
"use client";

import { LANDMARKS } from "./map";
import { Box, Roof } from "./parts";

const BRICK = "#9c4630";
const WOOD = "#3e2618";
const TILE = "#5e3426";
const STONE = "#c9bda6";
const GOLD = "#d4a52a";

/** A five-tiered pagoda (like Nyatapola) on a stepped stone plinth. */
function Pagoda() {
  const [x, z] = LANDMARKS.pagoda.center;
  return (
    <group position={[x, 0, z]}>
      {/* Plinth: five steps, each smaller than the one below */}
      {[0, 1, 2, 3, 4].map((i) => (
        <Box key={i} size={[12 - i * 1.6, 0.8, 12 - i * 1.6]} position={[0, 0.4 + i * 0.8, 0]} color={STONE} />
      ))}

      {/* Five storeys, each a brick body under a roof that overhangs it */}
      {[0, 1, 2, 3, 4].map((i) => {
        const y = 4 + i * 2.6;
        const width = 4.4 - i * 0.6;
        return (
          <group key={i}>
            <Box size={[width, 1.6, width]} position={[0, y + 0.8, 0]} color={BRICK} />
            <Roof bottom={width + 2.4} top={width * 0.6} height={1} y={y + 1.6} color={TILE} />
          </group>
        );
      })}

      {/* Gold finial on top */}
      <mesh position-y={17.8} castShadow>
        <coneGeometry args={[0.4, 1.6, 12]} />
        <meshStandardMaterial color={GOLD} metalness={0.6} roughness={0.35} />
      </mesh>
    </group>
  );
}

/** A three-storey brick house with carved wooden windows, facing the square (east). */
function NewaHome() {
  const [x, z] = LANDMARKS.home.center;
  return (
    <group position={[x, 0, z]}>
      <Box size={[8, 7.5, 10]} position={[0, 3.75, 0]} color={BRICK} />
      <Box size={[9, 0.2, 11]} position={[0, 7.5, 0]} color={WOOD} />
      <Roof bottom={10} top={2} height={1.8} y={7.6} color={TILE} />

      {/* Door, then a row of windows on each upper floor */}
      <Box size={[0.2, 2.2, 1.4]} position={[4.05, 1.1, 0]} color={WOOD} />
      {[3.4, 5.9].map((y) =>
        [-3, -1, 1, 3].map((dz) => <Box key={`${y}${dz}`} size={[0.2, 1.2, 1]} position={[4.05, y, dz]} color={WOOD} />),
      )}
    </group>
  );
}

export default function Buildings() {
  return (
    <>
      <Pagoda />
      <NewaHome />
    </>
  );
}
```

## src/components/world/Houses.tsx

```tsx
"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { houses } from "./map";

interface Part {
  position: [number, number, number];
  scale: [number, number, number];
  color: string;
}

/**
 * Draws many copies of one shape in a single draw call. Each copy (an
 * "instance") gets its own position, size and colour.
 */
function Instances({ parts, geometry }: { parts: Part[]; geometry: THREE.BufferGeometry }) {
  const mesh = useRef<THREE.InstancedMesh>(null!);

  useLayoutEffect(() => {
    const object = new THREE.Object3D(); // a helper to build each matrix
    const color = new THREE.Color();
    parts.forEach((p, i) => {
      object.position.set(...p.position);
      object.scale.set(...p.scale);
      object.updateMatrix();
      mesh.current.setMatrixAt(i, object.matrix);
      mesh.current.setColorAt(i, color.set(p.color));
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
  }, [parts]);

  return (
    <instancedMesh ref={mesh} args={[geometry, undefined, parts.length]} castShadow receiveShadow>
      <meshStandardMaterial roughness={0.9} />
    </instancedMesh>
  );
}

/** Every row house: a box for the walls and a hipped roof on top. */
export default function Houses() {
  const { walls, roofs } = useMemo(() => {
    const walls: Part[] = [];
    const roofs: Part[] = [];
    for (const h of houses) {
      const [x, z] = h.center;
      const [sx, sz] = h.size;
      walls.push({ position: [x, h.height / 2, z], scale: [sx, h.height, sz], color: h.wall });
      roofs.push({ position: [x, h.height + 0.9, z], scale: [sx + 0.8, 1.8, sz + 0.8], color: h.roof });
    }
    return { walls, roofs };
  }, []);

  // A 1 × 1 × 1 box, and a 1 × 1 × 1 roof shape; each instance scales them to size.
  const box = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const roof = useMemo(() => new THREE.CylinderGeometry(0.15, Math.SQRT1_2, 1, 4).rotateY(Math.PI / 4), []);

  return (
    <>
      <Instances parts={walls} geometry={box} />
      <Instances parts={roofs} geometry={roof} />
    </>
  );
}
```

## src/components/world/Car.tsx

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

## src/components/world/CameraRig.tsx

```tsx
"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { destinationById, solids } from "./map";
import { car, worldStore } from "./store";

const wrapAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

/** True if (x, z) is inside a building taller than `height`. */
function insideSolid(x: number, z: number, height: number) {
  return solids.some(
    (s) =>
      s.height > height &&
      Math.abs(x - s.center[0]) < s.size[0] / 2 + 0.5 &&
      Math.abs(z - s.center[1]) < s.size[1] / 2 + 0.5,
  );
}

/**
 * A chase camera behind the car that turns with it. Parked at a destination,
 * it swings round to look at the landmark. Everything is eased with `damp`, so
 * the camera glides instead of jumping.
 */
export default function CameraRig() {
  const rig = useRef({
    yaw: car.heading, // the direction the camera looks along, eased
    look: new THREE.Vector3(),
    desired: new THREE.Vector3(),
    lookTarget: new THREE.Vector3(),
  });

  useFrame(({ camera }, rawDelta) => {
    const dt = Math.min(rawDelta, 1 / 30);
    const r = rig.current;
    const { active } = worldStore.get();
    const parked = active !== null && Math.abs(car.speed) < 0.6;

    // Behind the car by default...
    let yaw = car.heading;
    let distance = 14 + Math.abs(car.speed) * 0.25; // further back at speed
    let height = 6.8;
    let ahead = 9; // look at a point this far ahead of the car
    let aheadHeight = 2.6;
    // ...but parked, look past the car at the landmark.
    if (parked && active) {
      const d = destinationById[active];
      const dx = d.center[0] - car.x;
      const dz = d.center[1] - car.z;
      yaw = Math.atan2(dx, dz);
      distance = 12;
      height = 5 + d.signHeight * 0.3;
      ahead = Math.hypot(dx, dz) * 0.7;
      aheadHeight = d.signHeight * 0.35;
    }
    // Turn smoothly, the short way round.
    r.yaw += wrapAngle(yaw - r.yaw) * (1 - Math.exp(-dt * (parked ? 1.6 : 3.2)));

    const fx = Math.sin(r.yaw);
    const fz = Math.cos(r.yaw);

    // Walk out from the car towards the camera spot; stop just before a building.
    let t = 1;
    for (let step = 0.05; step <= 1; step += 0.05) {
      if (insideSolid(car.x - fx * distance * step, car.z - fz * distance * step, height)) {
        t = Math.max(step - 0.08, 0.25);
        break;
      }
    }
    r.desired.set(car.x - fx * distance * t, height, car.z - fz * distance * t);
    r.lookTarget.set(car.x + fx * ahead, aheadHeight, car.z + fz * ahead);

    // `damp` moves a bit of the way each frame: the same speed at 30 or 144 fps.
    camera.position.x = THREE.MathUtils.damp(camera.position.x, r.desired.x, 4.5, dt);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, r.desired.y, 4.5, dt);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, r.desired.z, 4.5, dt);
    r.look.lerp(r.lookTarget, 1 - Math.exp(-5 * dt));
    camera.lookAt(r.look);
  });

  return null;
}
```

## src/components/world/Lake.tsx

```tsx
"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { LAKE } from "./map";
import { Box } from "./parts";

const [lx, lz] = LAKE.center;

/** A rowing boat that goes round the lake in a circle. */
function Boat({ radius, speed, start, color }: { radius: number; speed: number; start: number; color: string }) {
  const boat = useRef<THREE.Group>(null!);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const a = start + (t * speed) / radius; // angle round the circle
    boat.current.position.set(lx + Math.cos(a) * radius, Math.sin(t * 2 + start) * 0.05, lz + Math.sin(a) * radius);
    // Face the way it's moving: the circle's tangent, (-sin a, cos a).
    boat.current.rotation.y = Math.atan2(-Math.sin(a), Math.cos(a));
    boat.current.rotation.z = Math.sin(t * 1.3 + start) * 0.04; // a gentle rock
  });

  return (
    <group ref={boat}>
      <Box size={[1.3, 0.5, 3.6]} position={[0, 0.15, 0]} color={color} />
      <Box size={[1.1, 0.06, 3.3]} position={[0, 0.42, 0]} color="#8a5a36" />
      {/* The rower: body and head */}
      <Box size={[0.5, 0.7, 0.35]} position={[0, 0.8, 0]} color="#2f6fb0" />
      <Box size={[0.3, 0.3, 0.3]} position={[0, 1.3, 0]} color="#e0b48c" />
    </group>
  );
}

/** Phewa Lake: water, a stone rim, an island temple, and boats going round. */
export default function Lake() {
  return (
    <group>
      {/* Above the grass (at -0.05) so they don't flicker against it */}
      <mesh rotation-x={-Math.PI / 2} position={[lx, 0, lz]} receiveShadow>
        <circleGeometry args={[LAKE.radius, 64]} />
        <meshStandardMaterial color="#5f9fc0" roughness={0.25} metalness={0.1} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[lx, 0.02, lz]} receiveShadow>
        <ringGeometry args={[LAKE.radius, LAKE.radius + 1, 64]} />
        <meshStandardMaterial color="#c9bda6" />
      </mesh>

      {/* The island, with a small temple */}
      <mesh position={[lx, 0.3, lz]} castShadow receiveShadow>
        <cylinderGeometry args={[3, 3.4, 0.6, 24]} />
        <meshStandardMaterial color="#7da85e" />
      </mesh>
      <Box size={[2, 2, 2]} position={[lx, 1.6, lz]} color="#efe7d8" />
      <mesh position={[lx, 3.4, lz]} rotation-y={Math.PI / 4} castShadow>
        <coneGeometry args={[1.8, 1.6, 4]} />
        <meshStandardMaterial color="#b5161f" />
      </mesh>

      <Boat radius={8} speed={1.6} start={0} color="#e9a23b" />
      <Boat radius={11} speed={1.3} start={2} color="#3d8bd6" />
      <Boat radius={13} speed={1.1} start={4.2} color="#d64545" />
    </group>
  );
}
```

## src/components/world/People.tsx

```tsx
"use client";

import { useLayoutEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { isOpen, PAVED, seeded } from "./map";
import { car } from "./store";

const COUNT = 30;
const SHIRTS = ["#2f6fb0", "#d64545", "#e9a23b", "#2a9d8f", "#7c6fd6", "#f3efe6"];

interface Walker {
  x: number;
  z: number;
  /** Where they're walking to. */
  tx: number;
  tz: number;
  speed: number;
  /** Seconds to stand still before setting off again. */
  wait: number;
}

/** A random open spot on the square. */
function openSpot(rand: () => number): [number, number] {
  const [x0, x1, z0, z1] = PAVED;
  for (;;) {
    const x = x0 + rand() * (x1 - x0);
    const z = z0 + rand() * (z1 - z0);
    if (isOpen(x, z, 1.5)) return [x, z];
  }
}

// The crowd lives outside React: it changes every frame, like the car.
const rand = seeded(42);
const walkers = Array.from({ length: COUNT }, (): Walker => {
  const [x, z] = openSpot(rand);
  const [tx, tz] = openSpot(rand);
  return { x, z, tx, tz, speed: 0.8 + rand() * 0.6, wait: rand() * 3 };
});
const helper = new THREE.Object3D();

/**
 * People strolling round the square. 30 bodies are one instanced mesh and 30
 * heads another: two draw calls for the whole crowd. They step aside for the car.
 */
export default function People() {
  const bodies = useRef<THREE.InstancedMesh>(null!);
  const heads = useRef<THREE.InstancedMesh>(null!);

  // Colours are set once; positions change every frame.
  useLayoutEffect(() => {
    const color = new THREE.Color();
    walkers.forEach((_, i) => {
      bodies.current.setColorAt(i, color.set(SHIRTS[i % SHIRTS.length]));
      heads.current.setColorAt(i, color.set("#e0b48c"));
    });
    bodies.current.instanceColor!.needsUpdate = true;
    heads.current.instanceColor!.needsUpdate = true;
  }, []);

  useFrame(({ clock }, rawDelta) => {
    const dt = Math.min(rawDelta, 1 / 30);
    walkers.forEach((w, i) => {
      // Step aside if the car is close.
      const cx = w.x - car.x;
      const cz = w.z - car.z;
      const fromCar = Math.hypot(cx, cz);
      if (fromCar < 3.5 && fromCar > 0.01) {
        const nx = w.x + (cx / fromCar) * 4 * dt;
        const nz = w.z + (cz / fromCar) * 4 * dt;
        if (isOpen(nx, nz, 0.5)) {
          w.x = nx;
          w.z = nz;
        }
      }

      const dx = w.tx - w.x;
      const dz = w.tz - w.z;
      const d = Math.hypot(dx, dz);
      let moving = false;
      if (w.wait > 0) {
        w.wait -= dt;
      } else if (d < 0.3) {
        // Arrived: pause, then pick somewhere new (with a clear straight line to it).
        w.wait = 1 + rand() * 4;
        [w.tx, w.tz] = openSpot(rand);
      } else {
        const step = Math.min(d, w.speed * dt);
        const nx = w.x + (dx / d) * step;
        const nz = w.z + (dz / d) * step;
        if (isOpen(nx, nz, 0.5)) {
          w.x = nx;
          w.z = nz;
          moving = true;
        } else {
          [w.tx, w.tz] = openSpot(rand); // a building's in the way: go somewhere else
        }
      }

      // A little bob while walking.
      const bob = moving ? Math.abs(Math.sin(clock.elapsedTime * 8 + i)) * 0.08 : 0;
      helper.position.set(w.x, 0.55 + bob, w.z);
      helper.rotation.set(0, Math.atan2(dx, dz), 0);
      helper.updateMatrix();
      bodies.current.setMatrixAt(i, helper.matrix);
      helper.position.y = 1.35 + bob;
      helper.updateMatrix();
      heads.current.setMatrixAt(i, helper.matrix);
    });
    bodies.current.instanceMatrix.needsUpdate = true;
    heads.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      <instancedMesh ref={bodies} args={[undefined, undefined, COUNT]} castShadow frustumCulled={false}>
        <capsuleGeometry args={[0.28, 0.6, 4, 8]} />
        <meshStandardMaterial roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={heads} args={[undefined, undefined, COUNT]} castShadow frustumCulled={false}>
        <sphereGeometry args={[0.22, 12, 8]} />
        <meshStandardMaterial roughness={0.8} />
      </instancedMesh>
    </>
  );
}
```

## src/components/world/Signs.tsx

```tsx
"use client";

import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import type { SectionId } from "@/config/profile";
import { sections } from "@/config/profile";
import { destinations } from "./map";
import { driveTo } from "./store";

// Floating signs over the landmarks. They're normal HTML buttons (sharp text,
// clickable, readable by screen readers), moved every frame to where the
// landmark appears on screen.

const elements = new Map<SectionId, HTMLElement>();
const point = new THREE.Vector3();

/** Lives inside the <Canvas>. Mount it after the camera rig so it uses this frame's camera. */
export function SignTracker() {
  useFrame(({ camera, size }) => {
    for (const d of destinations) {
      const el = elements.get(d.id);
      if (!el) continue;
      point.set(d.center[0], d.signHeight, d.center[1]);
      const distance = point.distanceTo(camera.position);
      // project() turns a 3D point into screen coordinates from -1 to 1.
      point.project(camera);
      // z > 1 means the point is behind the camera.
      el.style.visibility = point.z > 1 ? "hidden" : "visible";
      const x = ((point.x + 1) / 2) * size.width;
      const y = ((1 - point.y) / 2) * size.height;
      const scale = THREE.MathUtils.clamp(40 / distance, 0.5, 1);
      el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${scale})`;
    }
  });
  return null;
}

/** The sign buttons, drawn over the canvas. Clicking one drives there. */
export function Signs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {destinations.map((d) => (
        <button
          key={d.id}
          ref={(el) => {
            if (el) elements.set(d.id, el);
            else elements.delete(d.id);
          }}
          type="button"
          onClick={() => driveTo(d.id)}
          className="pointer-events-auto absolute left-0 top-0 flex items-center gap-2 whitespace-nowrap rounded-full bg-white/95 py-1.5 pl-1.5 pr-4 shadow-md"
        >
          <span className="size-6 rounded-full" style={{ background: d.color }} />
          <span className="text-left leading-tight">
            <span className="block text-sm font-semibold">{sections[d.id].title}</span>
            <span className="block text-xs text-neutral-500">{d.place}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
```

## src/components/world/Minimap.tsx

```tsx
"use client";

import { useEffect, useRef } from "react";

import { destinations, houses, LAKE, LANDMARKS, PAVED } from "./map";
import { car, driveTo, driveToPoint } from "./store";

// The part of the world the map shows, in world units: x, z, width, height.
const VIEW = { x: -48, z: -48, w: 130, h: 96 };
const WIDTH = 240;
const HEIGHT = Math.round((WIDTH * VIEW.h) / VIEW.w);

/**
 * A top-down SVG map. Its coordinates ARE world coordinates (thanks to the
 * viewBox), so a house at [x, z] is simply drawn at (x, z). Click to drive.
 */
export default function Minimap() {
  const marker = useRef<SVGGElement>(null);

  // Move the car arrow every frame, without re-rendering React.
  useEffect(() => {
    let frame = 0;
    const tick = () => {
      const degrees = 180 - (car.heading * 180) / Math.PI;
      marker.current?.setAttribute("transform", `translate(${car.x} ${car.z}) rotate(${degrees})`);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const onClick = (e: React.MouseEvent<SVGSVGElement>) => {
    // Turn the click's pixel position back into world coordinates.
    const box = e.currentTarget.getBoundingClientRect();
    driveToPoint(VIEW.x + ((e.clientX - box.left) / box.width) * VIEW.w, VIEW.z + ((e.clientY - box.top) / box.height) * VIEW.h);
  };

  const [x0, x1, z0, z1] = PAVED;
  return (
    <svg
      width={WIDTH}
      height={HEIGHT}
      viewBox={`${VIEW.x} ${VIEW.z} ${VIEW.w} ${VIEW.h}`}
      onClick={onClick}
      className="cursor-crosshair rounded-xl bg-[#cfdcb4] shadow-md"
      role="img"
      aria-label="Map of the town"
    >
      <rect x={x0} y={z0} width={x1 - x0} height={z1 - z0} fill="#d9a58a" />
      <circle cx={LAKE.center[0]} cy={LAKE.center[1]} r={LAKE.radius} fill="#8fc3dc" />
      {[...houses, ...Object.values(LANDMARKS)].map((h, i) => (
        <rect key={i} x={h.center[0] - h.size[0] / 2} y={h.center[1] - h.size[1] / 2} width={h.size[0]} height={h.size[1]} fill="#9c5a44" />
      ))}
      {destinations.map((d) => (
        <circle
          key={d.id}
          cx={d.spot[0]}
          cy={d.spot[1]}
          r={2.5}
          fill={d.color}
          stroke="#fff"
          strokeWidth={0.8}
          className="cursor-pointer"
          onClick={(e) => {
            e.stopPropagation(); // don't also count as a click on the map
            driveTo(d.id);
          }}
        />
      ))}
      <g ref={marker}>
        <path d="M0 -3 L2.2 2.5 L0 1.3 L-2.2 2.5 Z" fill="#1f2937" stroke="#fff" strokeWidth={0.5} />
      </g>
    </svg>
  );
}
```

## src/components/world/Hud.tsx

```tsx
"use client";

import { useEffect } from "react";

import SectionContent from "@/components/SectionContent";
import { profile, sections } from "@/config/profile";
import { destinationById, destinations } from "./map";
import Minimap from "./Minimap";
import { engineSound } from "./engine";
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
  // Keyboard shortcuts: 1-3 drive to a place, Esc closes the panel, H honks.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (n >= 1 && n <= destinations.length) driveTo(destinations[n - 1].id);
      const { active } = worldStore.get();
      if (e.key === "Escape" && active) worldStore.set({ dismissed: active });
      if (e.code === "KeyH" && !e.repeat) engineSound.horn();
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

      <div className="absolute bottom-24 left-5 max-sm:hidden">
        <div className="pointer-events-auto">
          <Minimap />
        </div>
      </div>

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

## src/components/world/engine.ts

```ts
// An engine sound made with the Web Audio API: no audio files at all.
//
//   oscillator (a buzzing sawtooth wave) → low-pass filter (makes it a rumble)
//   → gain (volume) → speakers
//
// Browsers only allow sound after the visitor clicks or presses a key, so
// start() is called from the first click or key press.

/** The speed (m/s) at which each gear ends. */
const GEARS = [5, 9.5, 13.5, 17];

class EngineSound {
  private ctx: AudioContext | null = null;
  private osc: OscillatorNode | null = null;
  private gain: GainNode | null = null;
  enabled = true;

  start() {
    if (this.ctx) {
      void this.ctx.resume();
      return;
    }
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = 35;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 400;
    const gain = ctx.createGain();
    gain.gain.value = 0;

    osc.connect(filter).connect(gain).connect(ctx.destination);
    osc.start();
    this.ctx = ctx;
    this.osc = osc;
    this.gain = gain;
  }

  /** Called every frame with the car's speed. */
  update(speed: number) {
    if (!this.ctx || !this.osc || !this.gain) return;
    const s = Math.abs(speed);
    // Which gear are we in, and how far through it (0..1)?
    let gear = GEARS.findIndex((top) => s < top);
    if (gear < 0) gear = GEARS.length - 1;
    const low = gear === 0 ? 0 : GEARS[gear - 1];
    const through = Math.min((s - low) / (GEARS[gear] - low), 1);

    const now = this.ctx.currentTime;
    // setTargetAtTime glides to the new value instead of jumping (which clicks).
    this.osc.frequency.setTargetAtTime(34 + through * 70, now, 0.05);
    this.gain.gain.setTargetAtTime(this.enabled ? 0.04 + Math.min(s, 17) * 0.003 : 0, now, 0.08);
  }

  /** A short two-note horn. */
  horn() {
    if (!this.ctx || !this.enabled) return;
    const now = this.ctx.currentTime;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.02);
    gain.gain.setValueAtTime(0.08, now + 0.3);
    gain.gain.linearRampToValueAtTime(0, now + 0.35);
    gain.connect(this.ctx.destination);
    for (const frequency of [400, 500]) {
      const osc = this.ctx.createOscillator();
      osc.type = "square";
      osc.frequency.value = frequency;
      osc.connect(gain);
      osc.start(now);
      osc.stop(now + 0.36);
    }
  }
}

export const engineSound = new EngineSound();
```

## src/components/world/Sound.tsx

```tsx
"use client";

import { useEffect } from "react";
import { useFrame } from "@react-three/fiber";

import { engineSound } from "./engine";
import { car } from "./store";

/** Starts the sound on the first click or key press, then feeds it the car's speed. */
export default function Sound() {
  useEffect(() => {
    const start = () => engineSound.start();
    window.addEventListener("pointerdown", start);
    window.addEventListener("keydown", start);
    return () => {
      window.removeEventListener("pointerdown", start);
      window.removeEventListener("keydown", start);
    };
  }, []);

  useFrame(() => engineSound.update(car.speed));

  return null;
}
```
