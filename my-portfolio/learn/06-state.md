# Episode 6: Shared State Without Re-renders

**Goal:** a small `store.ts` that the 3D scene and the HTML on top can both use, fast enough for things that change 60 times a second.

**New ideas:** why `useState` is wrong for per-frame values, plain mutable objects, a tiny subscribable store, `useSyncExternalStore`.

---

## Part 1: The problem (3 min)

**Show:** a diagram: `<Car>` (inside the canvas) and `<Panel>` (HTML, outside it) both need to know about the car.

**Say:**

> Our car's position changes every frame, 60 times a second. If we kept it in React state with `useState`, React would re-render 60 times a second. That's slow, and it isn't needed: three.js can move an object without React doing anything.
>
> But some things **do** need React: when the car parks at the pagoda, the Projects panel must appear. That happens once, not 60 times a second.
>
> So we split our state in two:
>
> 1. **Fast things** (position, speed, steering) go in a plain JavaScript object. We change it directly. No re-renders.
> 2. **Slow things** (which place we're parked at, where the autopilot is going) go in a tiny store that React components can **subscribe** to. They re-render only when it actually changes.

## Part 2: The store (8 min)

Create `src/components/world/store.ts`:

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

**Line by line:**

- `WorldState` is the slow state:
  - `active`: the destination we're parked at.
  - `dismissed`: the panel the visitor closed. We keep `active` and `dismissed` separate, so closing the panel doesn't forget where you're parked, and you can reopen it.
  - `driving`: where the autopilot is going (episode 10).
- `state` and `listeners` are module variables: one copy for the whole app.
- `worldStore.set(patch)`:
  - If nothing actually changed, it returns early. This matters: the car calls `set` often, and we don't want to wake React up for nothing.
  - Otherwise it makes a **new** object (`{ ...state, ...patch }`). React compares by reference, so a new object means "something changed".
  - Then it calls every listener.
- `subscribe(listener)` adds a listener and returns a function that removes it. That's the shape React expects.

**`useWorld(selector)`:**

> `useSyncExternalStore` is React's built-in way to read from a store outside React. We give it three things: how to subscribe, how to read the current value, and what to use on the server. Our `useWorld` adds a **selector**, so `useWorld((s) => s.active)` re-renders only when `active` changes, not when `driving` does.

**The fast state:**

- `car` is a plain object. `heading` is the direction the car faces in radians (episode 7). `travelled` adds up distance to spin the wheels.
- Nothing subscribes to `car`. The code that needs it (the camera, the minimap) reads it every frame itself.

**Drive requests:**

> The HUD buttons are outside the canvas, but the car's logic runs inside it, every frame. So the buttons don't drive the car directly; they leave a note: `pending = { target, destination }`. On its next frame, the car picks up the note with `takeDriveRequest()`, which also clears it. It's like a mailbox. We'll use this in episode 10.

## Checkpoint

There's nothing new to see yet. That's normal: this is plumbing. Check that `pnpm lint` and `pnpm build` pass.

## Why not Redux or Zustand?

> You can use **Zustand**; it's made by the same people as React Three Fiber, and it works the same way. I wrote it by hand so you can see there's no magic: a store is an object, a list of listeners and a function that tells them something changed. It's about 30 lines.

## Say (outro)

> Fast state in a plain object, slow state in a tiny store. Next time we use it: a car you can actually drive, with real steering.
