# Episode 12: Bringing the Town to Life

**Goal:** thirty people strolling round the square (and stepping out of the car's way), and Phewa Lake with a temple island and rowing boats circling it.

**New ideas:** animated instances, a tiny "wander" AI, moving in a circle, faking water.

---

## Part 1: Why movement matters (1 min)

**Say:**

> An empty town feels dead. The secret of a living world isn't detail, it's **movement**: people walking, boats bobbing. And it's cheap if we do it right: the whole crowd will be two draw calls.

## Part 2: People (10 min)

Create `src/components/world/People.tsx`:

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

**Line by line:**

- A **walker** is just numbers: where they are (`x, z`), where they're going (`tx, tz`), how fast, and how long to wait.
- `openSpot(rand)` picks random points until one is on open paving, using `isOpen` from the map. This is called "rejection sampling": throw darts, keep the good ones.
- The crowd lives **outside React**, at module level, like `car`. It changes every frame, so it's fast state.
- `useLayoutEffect` sets each person's shirt colour **once**. Positions change every frame; colours don't.

**The wander AI, each frame per walker:**

1. **Car nearby?** If the car is within 3.5 m, step directly away from it, at 4 m/s, but only onto open paving.
2. **Waiting?** Count down.
3. **Arrived?** Wait 1–5 seconds, then pick a new spot.
4. **Otherwise** step towards the target. If the next step would go into a building, give up on that target and pick another. That's simple, and it never gets stuck.

**Drawing:**

- One `Object3D` helper builds every matrix: body at 0.55 m, head at 1.35 m, plus a small `|sin|` bob while walking. The `+ i` makes everyone's steps out of sync.
- `rotation y = atan2(dx, dz)` faces the walking direction (the same angle maths as the car).
- `frustumCulled={false}`: the people move, so three.js's saved bounding sphere would be wrong. Turning culling off for 30 small instances is cheaper than recalculating it.

> Want them smarter? This is exactly what the real site's `Npcs.tsx` grows into: tourists with a "home" spot and a direction to look, sitters on benches, vendors at stalls, a dog that follows its owner.

## Part 3: The lake and boats (6 min)

Create `src/components/world/Lake.tsx`:

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

**Moving in a circle (show the unit circle):**

> A point on a circle is `(cos a, sin a) × radius`. Increase the angle `a` over time, and it goes round. To go at a steady speed in metres per second, the angle grows by `speed ÷ radius` per second: a bigger circle needs a smaller angle for the same distance.
>
> Which way does the boat face? Along the circle's **tangent**, the direction it's moving, which is `(−sin a, cos a)`. `atan2` turns that into a rotation.

**Line by line:**

- `useFrame(({ clock }) => ...)` uses the total elapsed time, so the boat's position depends only on the time. No need to store anything.
- Bobbing up and down (`sin(t × 2) × 0.05`) and rocking side to side (`rotation.z`) make it look like it floats. Each boat has a different `start`, so they don't bob together.
- The water is a flat `circleGeometry`, quite smooth (`roughness 0.25`) and a little metallic, so it catches the light.
- The stone rim is a `ringGeometry` just outside the water, slightly higher (2 cm). Remember z-fighting!
- The island temple is a cylinder island, a white box and a red 4-sided cone roof.

Add both to the scene, before the car:

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
      {/* After the camera rig, so the signs use this frame's camera */}
      <SignTracker />
    </>
  );
}
```

## Checkpoint

- People wander the square, pause, and set off again. Drive at them: they hop out of the way.
- Three boats circle the island at different speeds, bobbing gently.
- Press 3 (Contact): the camera looks out over the lake.

## Common mistakes

| Problem | Fix |
| --- | --- |
| People flicker or vanish at the screen edge | Moving instances: set `frustumCulled={false}` (or recompute the bounding sphere). |
| Boats drive sideways | Facing angle: use the tangent (−sin a, cos a), not the position. |
| Water flickers with the rim | Give them different heights. |

## Say (outro)

> The town is alive. One thing is missing, and it makes a huge difference: sound. Next time we make an engine sound, with no audio files at all, just maths.
