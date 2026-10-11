# Episode 3: The Map Is Just Data

**Goal:** a `map.ts` file that describes the whole town (the square, the landmarks, rows of houses, a lake), and a quick preview of the houses in 3D.

**New ideas:** separating data from drawing, rectangles as `[minX, maxX, minZ, maxZ]`, seeded random generation, the `satisfies` keyword.

---

## Part 1: Why a map file? (2 min)

**Show:** a top-down sketch of the town: the square in the middle, houses on three sides, the pagoda at the top, the Newa home on the left, the lake on the right.

**Say:**

> Here's the most useful idea in this whole series: **the map is just data.** Before we draw anything, we write down where everything is, as plain numbers, in one file with no React and no three.js.
>
> Why? Because lots of things need to know where the buildings are. The renderer draws them. The car bumps into them. The camera avoids them. The minimap shows them. If the positions live in one file, they always agree.
>
> North is minus z, towards the top of the screen. Our square runs from -38 to +38 metres both ways. That's about the size of a real Durbar Square.

## Part 2: The map file (8 min)

Create `src/components/world/map.ts`:

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
```

**Line by line:**

- `Vec2 = [number, number]` is a point on the ground, `[x, z]`.
- `Rect = [minX, maxX, minZ, maxZ]` is a rectangle on the ground. The names in the type are just labels that show up in your editor.
- `PAVED` is the brick square. The car will only drive inside it.
- `START` is where the car begins. `heading: Math.PI` means it faces north. We'll explain headings in episode 7.
- `LANE_OFFSET` is for the autopilot: in Nepal we drive on the left.
- `LAKE` is a circle: centre and radius.
- **Destinations** are the portfolio sections placed in the town. Each has a `spot` (where the car parks), a `center` (the building, for its floating sign) and a `signHeight`.
- `destinationById` turns the list into an object, so `destinationById.projects` finds one instantly.

**Solids:**

> Everything you can bump into is a **solid**: a box on the ground with a centre, a size and a height. The height matters for the camera later: it can fly over a low wall but not a tall temple.

- `satisfies Record<string, Solid>` checks that each landmark has the right shape **without** losing the exact names, so `LANDMARKS.pagoda` still autocompletes.

**Seeded random (show reloading: the same town every time):**

> `seeded(7)` returns a function that gives "random" numbers, but always the same ones for seed 7. So every visitor sees the same town, and the houses don't jump around when you reload. Change the seed to 8 and you get a different, but also fixed, town.

> The maths, `seed * 16807 % 2147483647`, is a classic called the Park–Miller generator. You don't need to understand why it works; it just mixes the number up well.

**Building rows of houses:**

- `row(from, to)` walks along a line, dropping houses of random width (5–8 m) one after another until the line is full.
- `dx, dz` is the **direction** of the row: the line's length divided out, so it's 1 metre long. Moving `middle` metres along means `from + direction × middle`.
- If the row runs along x (`dx !== 0`), the house is `width` wide in x and 6 deep in z, and the other way round for rows along z.
- The height is 5 m plus 0, 1 or 2 extra storeys of 2.4 m.
- Wall and roof colours are picked from small palettes: brick reds and plaster creams.

**`isOpen(x, z, margin)`:**

> A helper we'll use a lot: is this point on the paving, and not inside or too close to any building? The townspeople will use it to choose where to walk.

## Part 3: A quick preview (3 min)

Update `src/components/world/Ground.tsx` so it reads the square from the map. Replace the top of the file:

```tsx
import * as THREE from "three";

import { PAVED } from "./map";
```

(and delete the old `const PAVED = ...` line).

Then show the houses as plain boxes. In `Scene.tsx`, import `houses` and replace the test cube:

```tsx
"use client";

import { OrbitControls } from "@react-three/drei";

import Ground from "./Ground";
import { houses } from "./map";

const HAZE = "#efe6d6";

export default function Scene() {
  return (
    <>
      <color attach="background" args={[HAZE]} />
      {/* Far things fade into the haze: it hides the edge of the world. */}
      <fog attach="fog" args={[HAZE, 70, 220]} />
      {/* Soft light from the sky above and the grass below */}
      <hemisphereLight args={["#e6eef6", "#a3b974", 1.45]} />
      {/* The sun: casts the shadows */}
      <directionalLight
        position={[-30, 55, 35]}
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

      <Ground />
      {/* Temporary: one mesh per house, to check the map. Episode 5 replaces this. */}
      {houses.map((h, i) => (
        <mesh key={i} position={[h.center[0], h.height / 2, h.center[1]]} castShadow receiveShadow>
          <boxGeometry args={[h.size[0], h.height, h.size[1]]} />
          <meshStandardMaterial color={h.wall} />
        </mesh>
      ))}

      {/* Drag to look around while we build. The chase camera replaces this in episode 8. */}
      <OrbitControls />
    </>
  );
}
```

**Say:**

> For each house we draw a box. A box's position is its **centre**, so we lift it by half its height to stand it on the ground.
>
> This works, but each house is its own mesh: about 50 separate "draw calls" to the graphics card. In episode 5 we'll draw all of them in **one**. For now, it lets us check the map.

## Checkpoint

- Rows of brick-red and cream boxes on the north, west and south of the square.
- Reload: exactly the same town.
- Change `seeded(7)` to `seeded(8)`: a different town.

## Common mistakes

| Problem | Fix |
| --- | --- |
| Houses half underground | Position y must be `height / 2`: a box is positioned by its centre. |
| Houses on the square | Check the row lines are at ±42: the square ends at ±38 and houses are 6 m deep. |
| `Cannot find module '@/config/profile'` | The `@/` alias points to `src/`. Check the file is at `src/config/profile.ts`. |

## Say (outro)

> Our town exists as data. Next time we build its two landmarks, a five-roofed pagoda and a Newari house, out of nothing but boxes.
