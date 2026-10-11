# Episode 7: Driving the Car

**Goal:** a little car you drive with WASD or the arrow keys. It accelerates, brakes, steers like a real car, spins its wheels, and can't drive through buildings.

**New ideas:** the game loop (`useFrame`), delta time, keyboard input, heading and `sin`/`cos`, the bicycle model, circle-vs-box collision.

---

## Part 1: The game loop (3 min)

**Show:** a timeline of frames: 16 ms, 16 ms, 33 ms (a slow one), 16 ms.

**Say:**

> Games run in a loop: read input, update the world, draw it, repeat, about 60 times a second. In React Three Fiber, `useFrame` gives us that loop. The function you pass runs once per frame, just before drawing.
>
> It also gives us **delta time**: how many seconds passed since the last frame. Always multiply movement by it. If the speed is 10 metres per second, we move `10 × dt` metres this frame. Then the car moves at the same real speed on a 60 Hz laptop and a 144 Hz gaming monitor.
>
> One safety rule: if you switch tabs and come back, `dt` can be a whole second, and the car would jump through a wall. So we cap it at 1/30 of a second.

## Part 2: Heading, sin and cos (4 min)

**Show:** a top-down drawing: a car at the origin, an arrow at angle θ from +z, and the arrow split into its x part (`sin θ`) and z part (`cos θ`).

**Say:**

> The car's **heading** is the angle it faces, in radians, measured from the +z direction (south, towards the camera at the start). Heading 0 faces +z. Heading π, half a turn, faces −z, north.
>
> To move forward, we need to split "forward" into its x part and its z part. That's exactly what sine and cosine do: x moves by `sin(heading)` and z by `cos(heading)`, times the distance. If you remember SOH-CAH-TOA, this is it.

## Part 3: The bicycle model (4 min)

**Show:** a diagram: two wheels (front and back), the wheelbase L between them, the front wheel turned by steering angle δ, and the circle the car drives round.

**Say:**

> How does a car turn? Not by spinning on the spot. The front wheels point a bit sideways, and the car drives along a circle. The sharper the steering, the smaller the circle. The longer the car, the bigger it.
>
> Engineers simplify a car to one front wheel and one back wheel, the **bicycle model**. Its turning rate is:
>
> **turning rate = speed ÷ wheelbase × tan(steering angle)**
>
> Notice: at speed 0, the turning rate is 0. A real car can't turn when it's standing still, and neither can ours. That one line makes it feel like a car instead of a tank.

## Part 4: The code (12 min)

Create `src/components/world/Car.tsx`:

```tsx
"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { PAVED, solids } from "./map";
import { Box, mat } from "./parts";
import { car } from "./store";

// How the car handles
const WHEELBASE = 2.5; // distance between the axles: shorter turns tighter
const RADIUS = 1.4; // size for bumping into things
const MAX_SPEED = 16;
const MAX_REVERSE = 6;
const MAX_STEER = 0.55; // radians
const ACCEL = 13;
const BRAKE = 28;
const DRAG = 3.5;

const clamp = THREE.MathUtils.clamp;
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

/** A wheel at (x, z) under the car. Front wheels turn with the steering. */
const WHEELS = [
  { x: -0.85, z: 1.25, front: true },
  { x: 0.85, z: 1.25, front: true },
  { x: -0.85, z: -1.25, front: false },
  { x: 0.85, z: -1.25, front: false },
];
const WHEEL_RADIUS = 0.36;

/** The visitor's car. WASD / arrow keys drive it, Space brakes. */
export default function Car() {
  const root = useRef<THREE.Group>(null!);
  const spinners = useRef<(THREE.Group | null)[]>([]);
  const pivots = useRef<(THREE.Group | null)[]>([]);
  const keys = useKeys();

  useFrame((_, rawDelta) => {
    // A long pause (switching tabs) shouldn't send the car flying.
    const dt = Math.min(rawDelta, 1 / 30);
    const k = keys.current;

    // 1. Keyboard: +1, 0 or -1 for each control.
    const throttle = (k.has("KeyW") || k.has("ArrowUp") ? 1 : 0) - (k.has("KeyS") || k.has("ArrowDown") ? 1 : 0);
    const steerInput = (k.has("KeyA") || k.has("ArrowLeft") ? 1 : 0) - (k.has("KeyD") || k.has("ArrowRight") ? 1 : 0);
    const braking = k.has("Space");

    // 2. Speed and steering. Steering gets gentler at speed.
    const targetSteer = steerInput * MAX_STEER * (1 - 0.45 * Math.min(Math.abs(car.speed) / MAX_SPEED, 1));
    if (throttle > 0) car.speed += (car.speed < 0 ? BRAKE : ACCEL) * dt;
    else if (throttle < 0) car.speed -= (car.speed > 0 ? BRAKE : ACCEL * 0.6) * dt;
    else car.speed = approach(car.speed, 0, DRAG * dt);
    if (braking) car.speed = approach(car.speed, 0, BRAKE * 1.2 * dt);
    car.speed = clamp(car.speed, -MAX_REVERSE, MAX_SPEED);

    // 3. Move: the "bicycle model". Turning rate = speed / wheelbase × tan(steering angle).
    car.steer = THREE.MathUtils.damp(car.steer, targetSteer, 10, dt);
    car.heading += (car.speed / WHEELBASE) * Math.tan(car.steer) * dt;
    car.x += Math.sin(car.heading) * car.speed * dt;
    car.z += Math.cos(car.heading) * car.speed * dt;
    if (collide()) car.speed *= 1 - Math.min(1, 5 * dt); // scrape to a halt

    // 4. Show it: move the model, spin the wheels, turn the front ones.
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

**Line by line:**

**Handling constants:** easy to tweak. Smaller `WHEELBASE` turns tighter. `ACCEL` is metres per second per second. `BRAKE` is stronger than `ACCEL` because brakes are stronger than engines. `DRAG` slows you when you let go.

**Helpers:**

- `clamp(v, min, max)` keeps a number inside a range.
- `approach(value, target, step)` moves towards a target without overshooting it. Perfect for "slow down to 0".

**`useKeys()`:**

- Stores the pressed keys in a `Set`, inside a **ref**, so pressing a key doesn't re-render anything.
- `e.code` is the physical key (`"KeyW"`), so WASD works on any keyboard layout.
- `preventDefault()` on Space stops the page from scrolling.
- On `blur` (you click another window) we clear all keys. Otherwise a key released outside the window stays "held" forever, and the car drives off on its own.
- The cleanup function removes the listeners when the component goes away.

**`collide()`:**

> The car is a **circle**; buildings are **boxes**. To find out if a circle hits a box: find the point of the box closest to the circle's centre. That's just `clamp` on x and on z. If that point is closer than the radius, we've hit it, so we push the car straight away from that point until it's exactly one radius away.
>
> Then we clamp the car inside the paved square too. It returns `true` if anything was hit, so we can slow the car down: it scrapes to a halt instead of sliding along at full speed.

**Inside `useFrame`:**

1. **Keyboard → numbers.** `throttle` is +1, 0 or −1; so is `steerInput`. Writing `(W ? 1 : 0) - (S ? 1 : 0)` means pressing both cancels out.
2. **Speed and steering.**
   - Steering gets gentler at speed, by up to 45%, like real power steering. Otherwise you'd spin out at top speed.
   - W while rolling backwards brakes first, then accelerates. S while rolling forwards brakes, then reverses (slower).
   - No keys: drag slows you down. Space: strong brakes.
3. **Move.**
   - `damp(car.steer, targetSteer, 10, dt)` turns the wheel smoothly instead of snapping. More on `damp` next episode.
   - The heading changes by the bicycle model.
   - Then move along the heading with `sin` and `cos`.
   - Then resolve collisions.
4. **Show it.**
   - Copy the numbers onto the 3D model.
   - The wheel's spin angle = distance travelled ÷ wheel radius. That's the definition of a radian: rolling one radius forward turns the wheel one radian. So the wheels never slip.

**The model:**

- The car body is three boxes: red body, white cabin, dark windscreen.
- Each wheel is a **pivot** group (steering) holding a **spinner** group (rolling) holding the tyre. Nesting groups means each one only does one job.
- `ref={(el) => { ... }}` is a **callback ref**: we collect the four groups into arrays to animate them.
- The tyre is a cylinder turned onto its side (`rotation-z={Math.PI / 2}`), and the light hub bar lets you see it spin.

## Part 5: Make the sun follow the car (2 min)

Update `Scene.tsx`: the sun becomes a component that follows the car, and we add `<Car />`:

```tsx
"use client";

import { useRef } from "react";
import { OrbitControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import Buildings from "./Buildings";
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

      {/* Drag to look around while we build. The chase camera replaces this in episode 8. */}
      <OrbitControls />
    </>
  );
}
```

**Say:**

> Remember the shadow box from episode 2, 96 metres wide? If the car drives outside it, it loses its shadow. So every frame we move the sun, and what it points at, along with the car. The shadow box goes wherever you go.
>
> `useRef<THREE.DirectionalLight>(null!)` is a ref to the actual three.js light object, so we can move it directly without React.

## Checkpoint

- W/S/A/D or the arrows drive the car. It can't turn on the spot. Space stops it.
- The wheels roll and the front ones steer.
- You can't drive into the pagoda, the house, or off the square.
- (The camera doesn't follow yet; orbit to watch. That's next.)

## Common mistakes

| Problem | Fix |
| --- | --- |
| Car moves sideways | Swapped `sin` and `cos`: x uses `sin`, z uses `cos`. |
| Steering is reversed | Check the sign: A gives +1, and positive steering turns left when facing −z. Flip `steerInput` if you changed the model's facing. |
| Car keeps driving after alt-tab | The `blur` listener that clears keys is missing. |
| Car is faster on a fast monitor | Something isn't multiplied by `dt`. |

## Say (outro)

> We can drive! But we keep losing the car off screen. Next time, a chase camera that follows smoothly behind it and never ends up inside a house.
