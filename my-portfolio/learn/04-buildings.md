# Episode 4: Building a Pagoda from Boxes

**Goal:** a five-tiered pagoda (like Nyatapola in Bhaktapur) and a Newa brick house, made from simple shapes.

**New ideas:** reusable 3D components, `<group>` for moving things together, sharing materials, making a square roof from a 4-sided cylinder.

---

## Part 1: Think in simple shapes (2 min)

**Show:** a photo of Nyatapola beside a sketch: steps → boxes, storeys → boxes, roofs → wedges, the top → a cone.

**Say:**

> You don't need Blender to make a nice building. Look at Nyatapola: it's five stone steps, five brick storeys, five sloping roofs and a gold top. Steps are boxes. Storeys are boxes. A sloping roof is a box that's wide at the bottom and narrow at the top. Let's make two little helper components and build everything from them.

## Part 2: Reusable parts (5 min)

Create `src/components/world/parts.tsx`:

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

**Line by line:**

- **`mat(color)`** returns a material for a colour, but creates each one **only once** and keeps it in a `Map`. Our town has hundreds of boxes and only about a dozen colours, so we use a dozen materials instead of hundreds. Fewer materials means less work for the graphics card.
- **`Box`** is a mesh with a `boxGeometry` and a shared material, casting and receiving shadows. `size` is `[width, height, depth]`.
- **`Roof`** uses `cylinderGeometry` with **4 sides**. A 4-sided cylinder is a square tube; give it a smaller top radius and it becomes a square, sloping roof.

**The √½ trick (draw a square with its diagonal):**

> A cylinder's radius goes from the centre to a **corner**. For a square of side 1, the corner is half the diagonal away: √2 ÷ 2, which is `Math.SQRT1_2`, about 0.707. So to get a square of side `bottom`, the radius is `bottom × 0.707`.
>
> A 4-sided cylinder also points its corners along x and z, like a diamond. Turning it 45° (`Math.PI / 4`) lines its sides up with our streets.

- `position-y={y + height / 2}`: like boxes, cylinders are positioned by their centre, so we lift it by half its height to sit its base at `y`.

## Part 3: The pagoda (5 min)

Create `src/components/world/Buildings.tsx`:

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

**Say:**

> A `<group>` is an invisible container. Everything inside it moves with it. So we build the pagoda around the point (0, 0, 0), and move the whole group to the pagoda's place on the map. The building code never needs to know where it stands.

**Line by line, the pagoda:**

- Plinth: `[0, 1, 2, 3, 4].map(...)` makes five steps. Each is 1.6 m smaller and 0.8 m higher than the one below. A loop instead of five copy-pasted lines.
- Storeys: five more loops. Storey `i` starts at `y = 4 + i × 2.6` and gets 0.6 m narrower each time. On each sits a roof 2.4 m wider than its walls, so the roof hangs over.
- The finial is a `coneGeometry` with `metalness` for a gold shine. It uses its own `<meshStandardMaterial>` because it's the only shiny thing.

**The Newa home:**

- One brick box for the walls, a wooden band, and a low roof.
- Its front faces **east** (+x), towards the square, so the door and windows sit at `x = 4.05`, just outside the wall (half of 8 = 4), so they don't z-fight with it.
- The window rows use a loop inside a loop: two floors × four windows.

Add it to `Scene.tsx`, after the houses:

```tsx
import Buildings from "./Buildings";
// ...
      <Buildings />
```

## Checkpoint

- A tall, five-roofed pagoda at the north of the square, with a gold top.
- A brick house on the west side with dark wooden windows facing the square.

## Challenge for viewers

> Make Nyatapola's famous stair guardians: put pairs of small boxes on each side of the steps. Or give the Newa house carved roof struts: thin boxes, tilted with a `rotation`.

## Common mistakes

| Problem | Fix |
| --- | --- |
| Roofs look like diamonds | Forgot `rotation-y={Math.PI / 4}`. |
| Windows flicker | They're exactly on the wall: move them a few centimetres out. |
| The pagoda is at the centre of the square | The `<group>` needs `position={[x, 0, z]}` from `LANDMARKS`. |

## Say (outro)

> Two landmarks, built from boxes and cones. But our houses are still one mesh each. Next time, a trick that draws all of them at once: instancing.
