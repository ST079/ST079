# Episode 5: A Hundred Houses, One Draw Call

**Goal:** draw every house wall in one go, and every roof in one more, with each house still its own size and colour.

**New ideas:** draw calls, `InstancedMesh`, transformation matrices, per-instance colour, `useLayoutEffect`.

---

## Part 1: What's a draw call? (3 min)

**Show:** the browser's performance monitor, or `renderer.info.render.calls` logged in the console. Then a drawing: the CPU sending a list of jobs to the GPU.

**Say:**

> Each time three.js says to the graphics card "draw this mesh", that's a **draw call**. The graphics card is incredibly fast at drawing triangles, but each separate request has overhead. A few hundred draw calls is fine; a few thousand and your frame rate drops, especially on phones.
>
> Our houses are all boxes. So instead of saying "draw a box here" fifty times, we say once: "draw this box fifty times, and here's a list of where and what colour". That's **instancing**.

## Part 2: The Instances component (6 min)

Create `src/components/world/Houses.tsx`:

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

**Line by line, `Instances`:**

- `<instancedMesh args={[geometry, undefined, parts.length]}>` is one geometry, a material (we pass `undefined` because the material is the child `<meshStandardMaterial>`), and how many copies.
- Each copy needs a **matrix**, 16 numbers that combine position, rotation and scale. Nobody writes these by hand. We use a helper `Object3D`: set its position and scale like a normal object, call `updateMatrix()`, and copy its matrix with `setMatrixAt(i, ...)`.
- `setColorAt(i, color)` gives each copy its own colour. The material's own colour is multiplied by it, which is why we leave the material white.
- `needsUpdate = true` tells three.js "these lists changed, send them to the graphics card".
- `useLayoutEffect` runs after React has created the mesh but **before** the screen is painted, so you never see a frame with all the houses at (0, 0, 0).

**Line by line, `Houses`:**

- For each house in the map we make a **wall part**: centre lifted by half the height, scaled to the house's size.
- And a **roof part**, scaled 0.8 m bigger than the walls for an overhang.
- `box` is a **1 × 1 × 1** box. Each instance scales it to the house's real size. One shape, many sizes.
- `roof` is a 4-sided cylinder with a small top (0.15) and a bottom radius of √½, so its base is exactly 1 × 1 after `rotateY(π / 4)`. Note `rotateY` on the **geometry** turns the shape itself, once. Every instance then gets an already-turned roof.
- Both geometries are made once, in `useMemo`.

**Say:**

> Two draw calls for every house in town, however many there are. Change the rows to make 500 houses and it'll still be smooth.

## Part 3: Swap it in (2 min)

In `Scene.tsx`, delete the temporary `houses.map(...)` boxes and the `houses` import, and add `<Houses />`:

```tsx
"use client";

import { OrbitControls } from "@react-three/drei";

import Buildings from "./Buildings";
import Ground from "./Ground";
import Houses from "./Houses";

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
      <Houses />
      <Buildings />

      {/* Drag to look around while we build. The chase camera replaces this in episode 8. */}
      <OrbitControls />
    </>
  );
}
```

## Checkpoint

- The same town, now with hipped roofs on every house.
- Bonus: log `useThree((s) => s.gl).info.render.calls` in a component, or install the [r3f-perf](https://github.com/utsuboco/r3f-perf) package, and compare draw calls before and after.

## Common mistakes

| Problem | Fix |
| --- | --- |
| All houses are white | `setColorAt` not called, or `instanceColor.needsUpdate` not set. |
| All houses at the centre, stacked | `setMatrixAt` not called, or `object.updateMatrix()` forgotten. |
| Instances vanish at the edge of the screen | three.js works out the instanced mesh's bounds once. If you **move** instances later (we will, for people in episode 12), call `mesh.computeBoundingSphere()` after moving them, or set `frustumCulled={false}`. |

## Say (outro)

> The town is built. Now we need a car, and a car moves every frame. Next time: how to share fast-changing state between 3D and React **without** making React re-render 60 times a second.
