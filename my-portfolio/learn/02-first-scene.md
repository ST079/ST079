# Episode 2: Your First 3D Scene

**Goal:** a brick-paved square on green grass, lit by the sun, with real shadows and a hazy horizon. You can drag to look around.

**New ideas:** `<Canvas>`, mesh = geometry + material, lights, shadows, fog, textures drawn on a `<canvas>`, z-fighting.

---

## Part 1: How 3D works, in one minute (3 min)

**Show:** a whiteboard drawing: a camera (an eye), a cube, a light.

**Say:**

> Every 3D scene has the same four things.
>
> A **scene**, the world that holds everything. A **camera**, our eye in the world. **Lights**, because without light everything is black. And **meshes**, the actual objects.
>
> A mesh is two things together: a **geometry**, the shape, like a box or a sphere, and a **material**, what the surface looks like: its colour, and whether it's shiny or matte.
>
> In React Three Fiber we write these as JSX. Instead of `<div>` we write `<mesh>`. Instead of CSS we set `position`, `rotation` and `color`.
>
> One more thing: directions. In three.js, **x** goes right, **y** goes up, and **z** comes towards you. The ground is the x–z plane. Our map will use `[x, z]` pairs, like a city map seen from above.

## Part 2: The Canvas (4 min)

Replace `src/components/world/World.tsx`:

```tsx
"use client";

import { Canvas } from "@react-three/fiber";

import Scene from "./Scene";

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

      <button
        type="button"
        onClick={onExit}
        className="absolute right-5 top-5 rounded-full bg-white/90 px-4 py-2 text-sm font-medium shadow-sm hover:bg-white"
      >
        Classic view
      </button>
    </div>
  );
}
```

**Line by line:**

- `<Canvas>` from R3F creates the scene, the camera and the renderer, and draws the scene about 60 times per second. Everything inside it is 3D.
- `shadows` turns shadows on (they're off by default because they cost speed).
- `flat` keeps colours exactly as we write them (no "tone mapping"), so `#d64545` really looks like `#d64545`.
- `dpr={[1, 1.75]}` is the device pixel ratio. On sharp "retina" screens we draw up to 1.75× more pixels, but no more, because drawing 3× pixels on a phone gets slow.
- `camera={{ position: [0, 30, 60], fov: 52, near: 0.5, far: 600 }}`: the camera starts 30 m up and 60 m back. `fov` is how wide it sees (in degrees). Nothing nearer than 0.5 m or further than 600 m is drawn.
- The **Classic view** button is plain HTML on top of the canvas. HTML and 3D mix just fine.

## Part 3: Lights, fog and a test cube (5 min)

Create `src/components/world/Scene.tsx`:

```tsx
"use client";

import { OrbitControls } from "@react-three/drei";

import Ground from "./Ground";

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

      {/* A test cube, to check the light and shadows */}
      <mesh position={[0, 1, 0]} castShadow>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="#d64545" />
      </mesh>

      {/* Drag to look around while we build. The chase camera replaces this in episode 8. */}
      <OrbitControls />
    </>
  );
}
```

**Say:**

> `<color attach="background">` sets the sky colour. `attach` means "set this as the scene's background" instead of adding it as an object.
>
> `<fog>` fades things into that same colour between 70 and 220 metres away. It looks like haze in the Kathmandu valley, and it hides the edge of our world for free.
>
> We have two lights. The **hemisphere light** is soft light from everywhere: bluish from the sky, greenish bounced up from the grass. It fills in the shadows so they're not pitch black.
>
> The **directional light** is the sun: parallel rays from one direction. It's the one that casts shadows.

**Shadows explained (show a diagram of a box-shaped shadow camera):**

> How do shadows work? The sun takes its own picture of the scene, a "shadow map", and anything that's hidden from the sun is in shadow. That picture only covers a box: here, from -48 to 48 metres left, right, top and bottom. `shadow-mapSize` is the picture's resolution: 2048 by 2048 pixels. Bigger box means blurrier shadows; bigger map means slower.
>
> `shadow-bias` and `shadow-normalBias` fix "shadow acne", ugly stripes on surfaces caused by the shadow map's limited precision. Try setting them to 0 and you'll see the stripes.

> The `shadow-mapSize` style is R3F's **dash syntax**: `shadow-mapSize` sets `light.shadow.mapSize`. Any nested property works this way.

- The test cube has `castShadow`; the ground (next) has `receiveShadow`. Both are needed for a shadow to appear.
- `<OrbitControls />` from drei lets you drag to rotate, scroll to zoom, and right-drag to pan. It's only for building; in episode 8 our own chase camera replaces it.

## Part 4: A brick square, drawn with code (6 min)

Create `src/components/world/Ground.tsx`:

```tsx
"use client";

import { useMemo } from "react";
import * as THREE from "three";

// The paved square: [minX, maxX, minZ, maxZ]. It moves to map.ts in episode 3.
const PAVED = [-38, 38, -38, 38];

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

/** Grass everywhere, and the brick square. */
export default function Ground() {
  const [x0, x1, z0, z1] = PAVED;
  const width = x1 - x0;
  const depth = z1 - z0;
  // One texture repeat every 3 metres.
  const bricks = useBrickTexture(width / 3, depth / 3);

  return (
    <>
      {/* A little lower than the paving, so the two never flicker ("z-fighting"). */}
      <mesh rotation-x={-Math.PI / 2} position-y={-0.05} receiveShadow>
        <planeGeometry args={[800, 800]} />
        <meshStandardMaterial color="#a3b974" />
      </mesh>

      <mesh rotation-x={-Math.PI / 2} position={[(x0 + x1) / 2, 0, (z0 + z1) / 2]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial map={bricks} roughness={0.95} />
      </mesh>
    </>
  );
}
```

**Say:**

> We could download a brick photo, but drawing one is more fun and it's tiny. A `<canvas>` element is a picture we can draw on with JavaScript. We draw brown mortar, then rows of bricks in slightly different colours, and every other row shifted half a brick. That's called a running bond, like real Bhaktapur paving.

**Line by line:**

- `useMemo(() => ..., [repeatX, repeatZ])` builds the texture **once**, not on every render.
- `let seed = 11; const rand = () => ...` is a tiny **seeded random number generator**. `Math.random()` gives different bricks every time you reload; a seeded one gives the same "random" bricks every time. We'll reuse this trick for the whole town.
- `new THREE.CanvasTexture(canvas)` turns the drawing into a texture.
- `RepeatWrapping` + `repeat.set(...)` tiles it. The square is 76 m wide, so it repeats 76 / 3 ≈ 25 times: one tile every 3 metres.
- `colorSpace = SRGBColorSpace` says "these are normal screen colours", so they don't look washed out.
- `anisotropy = 8` keeps the bricks sharp when you look across the square at a low angle.

**The planes:**

- `planeGeometry` is a flat rectangle standing up like a wall. `rotation-x={-Math.PI / 2}` tips it 90° back so it lies flat on the ground.
- The grass is 800 × 800 m, at y = **-0.05**.

**Z-fighting (show it happening: set the grass to y = 0):**

> If two surfaces are at exactly the same height, the graphics card can't decide which one is in front, so they flicker. That's called **z-fighting**. The fix: keep a small gap. The grass sits 5 cm below the paving. You'll see this bug again with water and boats. Now you know the fix.

## Checkpoint

- A brick square on grass, a red cube with a shadow, a hazy horizon.
- Drag to orbit around. The far grass fades into the sky.

## Common mistakes

| Problem | Fix |
| --- | --- |
| Everything is black | No lights, or the material is `meshBasicMaterial` with no colour. Check the two lights. |
| No shadow | The light needs `castShadow`, the cube `castShadow`, the ground `receiveShadow`, and the `<Canvas>` needs `shadows`. |
| Bricks are stretched or huge | `texture.repeat` not set, or `wrapS/wrapT` not `RepeatWrapping`. |
| The ground flickers | Z-fighting: give overlapping flat surfaces different heights. |

## Say (outro)

> We have a world with sunlight and shadows. Next time we'll describe our whole town as plain data, a little map file, and the computer will build the houses for us.
