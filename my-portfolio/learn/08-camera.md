# Episode 8: A Chase Camera

**Goal:** a camera that glides behind the car, turns with it, never goes inside a building, and swings round to show the landmark when you park.

**New ideas:** smoothing with `damp` (and why plain `lerp` is wrong), wrapping angles, stepping along a line to find walls.

---

## Part 1: Smooth following (4 min)

**Show:** two cameras side by side: one glued to the car (jerky), one smoothed (cinematic).

**Say:**

> If the camera were glued to the car, every tiny steering correction would shake the screen. Instead, each frame the camera moves **part of the way** towards where it wants to be. Far away: it moves fast. Almost there: it slows down. That's **exponential smoothing**.
>
> Many tutorials write `position = lerp(position, target, 0.1)`: move 10% of the way each frame. The problem: at 144 frames per second that's 144 steps of 10%, at 30 fps only 30. The camera is faster on faster screens!
>
> three.js has the fix built in: `THREE.MathUtils.damp(current, target, lambda, dt)`. It uses delta time, so the camera feels the same on every screen. `lambda` is how snappy it is: bigger is faster.

## Part 2: Angles wrap around (2 min)

**Show:** a circle with two angles, 170° and −170°: 20° apart, not 340°.

**Say:**

> Angles have a trap. If the car faces 179° and turns to −179°, it only turned 2°. But the difference of the numbers is 358°, and a naive camera would spin all the way round the long way.
>
> `wrapAngle` fixes it: `atan2(sin(a), cos(a))` brings any angle into the range −π to π. So the camera always turns the short way.

## Part 3: The camera rig (8 min)

Create `src/components/world/CameraRig.tsx`:

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

**Line by line:**

- `insideSolid(x, z, height)` asks whether a point is inside a building taller than the camera. Low buildings don't count: the camera passes over them.
- `rig` is a ref holding the camera's smoothed values between frames. A ref, not state, so no re-renders.
- **Where the camera wants to be:**
  - Driving: 14 m behind the car (further back at speed, so you can see what's coming) and 6.8 m up. It looks at a point 9 m **ahead** of the car, not at the car itself, so you see where you're going.
  - Parked at a landmark: `yaw` points from the car to the landmark, so the camera looks past the car at it. Height and aim scale with the landmark's sign height, which is high for the pagoda and low for the lake.
- **Turning:** `r.yaw += wrapAngle(yaw - r.yaw) × (1 - e^(−dt × rate))` is `damp` for angles, the short way round. It's slower when parked, for a calm swing.
- **Forward vector:** `fx = sin(yaw)`, `fz = cos(yaw)`, the same trick as the car. "Behind" is minus forward.

**Not going inside houses (show a diagram: dots stepping from the car out to the camera, stopping at a wall):**

> We walk from the car out to the camera's spot in 20 steps. At each step we ask "am I inside a building?" At the first one that's inside, we stop a little short, and the camera sits there instead, closer to the car. It's simple and works well. On the real site I use a faster exact test called a ray–box intersection, but the idea is the same.

- `Math.max(step - 0.08, 0.25)` means a bit before the wall, but never closer than a quarter of the distance.
- Finally, `damp` each position axis, and `lerp` the look-at point with an exponential factor (the same maths as `damp`), and `camera.lookAt`.

## Part 4: Swap out OrbitControls (1 min)

In `Scene.tsx`, delete the `OrbitControls` import and `<OrbitControls />`, and add the rig after the car:

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
      <Car />
      <CameraRig />
    </>
  );
}
```

> The rig goes **after** `<Car />`. `useFrame` callbacks run in the order components mount, so the camera follows the car's position from **this** frame, not the last one. Otherwise the car looks like it shivers.

## Checkpoint

- The camera glides behind the car and swings round when you turn.
- Drive close to the houses: the camera comes in instead of going through the wall.

## Common mistakes

| Problem | Fix |
| --- | --- |
| Camera spins 360° at some angle | Missing `wrapAngle`. |
| Car shivers | `CameraRig` mounted before `Car`. |
| Camera still clips walls | The `+ 0.5` margin in `insideSolid` is too small, or the step is too coarse. |

## Say (outro)

> It feels like a game now. Next time we make it a portfolio: park at a landmark, and its section opens.
