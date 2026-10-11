# Episode 11: Floating Signs and a Minimap

**Goal:** a clickable sign floating over each landmark (sharp HTML, not blurry 3D text), and a top-down minimap that shows where you are and drives you anywhere you click.

**New ideas:** projecting a 3D point to the screen, updating the DOM every frame without React, SVG `viewBox` as a coordinate system.

---

## Part 1: 3D → screen (4 min)

**Show:** the camera's view as a rectangle with corners (−1, −1) and (1, 1), and a 3D point landing inside it.

**Say:**

> We want an HTML label to follow a point in the 3D world. three.js can tell us where a 3D point lands on the screen: `vector.project(camera)`.
>
> It gives back x and y from −1 to 1, called "normalized device coordinates". −1 is the left or bottom edge, +1 the right or top. To get pixels: `x = (ndc.x + 1) / 2 × width`. For y we flip it, because on screens y goes **down**: `y = (1 − ndc.y) / 2 × height`.
>
> And if `z` is more than 1, the point is **behind** the camera. Hide the sign, or it shows up mirrored.

## Part 2: The signs (6 min)

Create `src/components/world/Signs.tsx`:

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

**Line by line:**

- There are **two** components:
  - `Signs` renders normal HTML buttons, **outside** the canvas.
  - `SignTracker` runs **inside** the canvas, where it can use `useFrame` and the camera, and moves those buttons every frame.
- They share the `elements` map. Each button registers itself with a callback ref (`elements.set(d.id, el)`), and removes itself when it unmounts.
- Each frame, for each destination:
  - Take the point above the landmark at `signHeight`, and `project` it.
  - Hide the button if the point is behind the camera.
  - Set `transform: translate3d(x, y, 0)` directly on the element. That's GPU-friendly, and **React doesn't re-render at all**.
  - `translate(-50%, -50%)` centres the sign on the point.
  - `scale` shrinks faraway signs a bit, between 50% and 100%.
- Why HTML and not 3D text? It's sharp at any size, it's a real `<button>` (keyboard and screen-reader friendly), and Tailwind styles it.

Add both: `<Signs />` in `World.tsx` (between the canvas and the HUD):

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

and `<SignTracker />` at the **end** of `Scene.tsx`, after the camera rig, so the signs use this frame's camera position:

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
      <Car />
      <CameraRig />
      {/* After the camera rig, so the signs use this frame's camera */}
      <SignTracker />
    </>
  );
}
```

## Part 3: The minimap (6 min)

**Say:**

> For the minimap I use SVG, and there's a beautiful trick: SVG's `viewBox` lets us choose the coordinate system. If I say the viewBox starts at (−48, −48) and is 130 by 96 units, then I can draw a house at its **world** position. No conversion maths at all. The map file feeds the minimap directly.

Create `src/components/world/Minimap.tsx`:

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

**Line by line:**

- `VIEW` is the world area shown. `HEIGHT` keeps the same aspect ratio as that area.
- `<rect>` for the paving, `<circle>` for the lake, one `<rect>` per house and landmark. Each is drawn at its centre minus half its size, because SVG rects start at their top-left corner.
- The **car arrow** moves in a `requestAnimationFrame` loop, by setting its `transform` attribute directly. Again, no React re-renders.
  - The arrow is drawn pointing **up** (−z). The car's heading 0 points +z (down), so we rotate by `180 − heading in degrees`.
- **Clicking:**
  - Turn the click's pixel position back into world coordinates (the reverse of the viewBox mapping), and `driveToPoint`.
  - The destination dots call `driveTo` and `stopPropagation()`, so the click doesn't **also** count as a click on the map behind them.
- `role="img"` and `aria-label` describe it for screen readers.

Add it to the HUD, bottom left, hidden on phones:

```tsx
"use client";

import { useEffect } from "react";

import SectionContent from "@/components/SectionContent";
import { profile, sections } from "@/config/profile";
import { destinationById, destinations } from "./map";
import Minimap from "./Minimap";
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

## Checkpoint

- Coloured signs float over the pagoda, the home and the lake, and stay put as you drive.
- Click a sign: the car drives there.
- The minimap's arrow turns and moves with the car. Click the map: the car drives to that spot.

## Common mistakes

| Problem | Fix |
| --- | --- |
| Signs appear mirrored when facing away | Hide when `point.z > 1`. |
| Signs lag one frame behind | `SignTracker` must come after `CameraRig` in the scene. |
| Minimap is upside down | In SVG, y grows downwards, just like our z. Draw (x, z) as (x, y) directly, no flip. |

## Say (outro)

> Signs and a map: no visitor gets lost now. Next time we bring the town to life with people walking around, and a lake with boats.
