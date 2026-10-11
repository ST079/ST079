# Episode 9: Landmarks Open Your Portfolio

**Goal:** park next to the pagoda and the **Projects** card slides in; drive away and it closes. Esc closes it by hand. Your name sits in the corner.

**New ideas:** proximity checks, hysteresis (two radii), HTML overlays over a canvas, `pointer-events`, a phone-friendly bottom sheet.

---

## Part 1: When are we "parked"? (3 min)

**Show:** a top-down drawing: a destination spot with two circles around it, 4 m (open) and 6.5 m (close).

**Say:**

> When do we open the panel? When the car is **close** to a destination's parking spot, and **slow**. We don't want panels popping open as you speed past.
>
> And when do we close it? Here's a subtle trick. If "open" and "close" used the same distance, sitting right at the edge would flicker it open, closed, open. So we use two distances: open within **4 m**, close only beyond **6.5 m**. That gap is called **hysteresis**; your home thermostat uses the same idea.

## Part 2: Parking in the car's loop (4 min)

In `Car.tsx`, add the imports and constants:

```tsx
import type { SectionId } from "@/config/profile";
import { destinationById, destinations, PAVED, solids } from "./map";
// ...
import { car, worldStore } from "./store";

// ... (next to the other handling constants)
// Parking within this distance of a spot (and slowly) opens its panel.
const PARK_RADIUS = 4;
const LEAVE_RADIUS = 6.5;
```

A helper that finds the nearest destination (put it after `collide`):

```tsx
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
```

And in `useFrame`, right after the speed is clamped:

```tsx
    // Stopping near a destination opens its panel; driving away closes it.
    const near = nearestDestination();
    const { active } = worldStore.get();
    if (near.id && near.distance < PARK_RADIUS && Math.abs(car.speed) < 3 && active !== near.id) {
      worldStore.set({ active: near.id, dismissed: null });
    } else if (active) {
      const spot = destinationById[active].spot;
      if (Math.hypot(car.x - spot[0], car.z - spot[1]) > LEAVE_RADIUS) worldStore.set({ active: null, dismissed: null });
    }
```

**Say:**

> `Math.hypot(dx, dz)` is the distance between two points: Pythagoras, √(dx² + dz²).
>
> This runs every frame, but `worldStore.set` only wakes React up when something **changes**, remember the early return in episode 6? So the panel renders once when you arrive, not 60 times a second.
>
> Opening also clears `dismissed`, so a panel you closed opens again next time you visit.

The camera already reacts: in episode 8 we wrote "if parked, look at the landmark". Park now and watch it swing round.

## Part 3: The HUD (6 min)

Create `src/components/world/Hud.tsx`:

```tsx
"use client";

import { useEffect } from "react";

import SectionContent from "@/components/SectionContent";
import { profile, sections } from "@/config/profile";
import { destinationById } from "./map";
import { useWorld, worldStore } from "./store";

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

/** Everything drawn on top of the 3D world. */
export default function Hud({ onExit }: { onExit: () => void }) {
  // Esc closes the panel.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
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

      <Panel />
    </div>
  );
}
```

**Line by line, `Panel`:**

- `useWorld((s) => s.active)` and `useWorld((s) => s.dismissed)` mean this component re-renders only when these change.
- If nothing's active, or the visitor closed it, render nothing.
- `SectionContent` is the **same** component the classic page uses. One source of truth.
- The ✕ button sets `dismissed`; the car is still parked, so `active` stays.
- **Responsive with Tailwind:** on phones, `inset-x-2 bottom-20` makes it a **bottom sheet** across the screen. From the `sm:` size up, it becomes a 400 px card on the right. `max-h-[50vh] overflow-y-auto` lets long content scroll inside the card.

**`pointer-events` (show clicking through the HUD onto the ground):**

> The HUD layer covers the whole screen. If it caught every click, you couldn't click the 3D world behind it. So the layer has `pointer-events-none`, and clicks go through, and only the actual buttons and cards turn them back on with `pointer-events-auto`.

**Keyboard:** Esc dismisses the active panel. The listener is added once (`[]`) and removed on cleanup.

Replace the Classic view button in `World.tsx` with the HUD:

```tsx
"use client";

import { Canvas } from "@react-three/fiber";

import Hud from "./Hud";
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

      <Hud onExit={onExit} />
    </div>
  );
}
```

## Checkpoint

- Drive to the pagoda's front and stop: the Projects card slides in, and the camera turns to the pagoda.
- Esc or ✕ closes it. Drive away and come back: it opens again.
- Same for the Newa home (About) and the east edge facing the lake (Contact).
- Narrow the browser: the card becomes a bottom sheet.

## Common mistakes

| Problem | Fix |
| --- | --- |
| Can't click the 3D world any more | The HUD's outer `div` is missing `pointer-events-none`. |
| Buttons in the HUD don't work | They're missing `pointer-events-auto`. |
| Panel flickers at the edge | Using one radius for open and close; use two. |

## Say (outro)

> It's a real portfolio now. But visitors have to find each place themselves. Next time: an autopilot. Click a destination and the car drives there by itself, finding the shortest route.
