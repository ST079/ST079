# Episode 13: Engine Sound With No Audio Files

**Goal:** an engine that hums at idle, climbs in pitch as you speed up, drops when it changes gear, and a horn on H. All made in code.

**New ideas:** the Web Audio API (`AudioContext`, oscillator, filter, gain), the autoplay rule, smooth parameter changes.

---

## Part 1: Sound is just a wave (4 min)

**Show:** an oscilloscope-style drawing: a sine wave, then a sawtooth wave. Then a chain of boxes: oscillator → filter → gain → speakers.

**Say:**

> Sound is air vibrating. A computer makes sound by sending a wave to the speakers. How fast the wave repeats is the **pitch** (frequency, in hertz). How tall it is is the **volume**.
>
> The browser has a built-in synthesiser called the **Web Audio API**. You connect little boxes together, like guitar pedals:
>
> - An **oscillator** makes a wave. A smooth sine wave sounds like a flute. A jagged **sawtooth** sounds buzzy, like an engine.
> - A **low-pass filter** removes the high, fizzy part, so the buzz becomes a rumble.
> - A **gain** node is a volume knob.
>
> Connect them to the speakers, and you have an engine. No MP3s to download, and it reacts to the car instantly.
>
> One rule: browsers don't let websites make noise until the visitor clicks or presses a key. That's the **autoplay policy**. So we start the sound on the first click or key press.

## Part 2: The engine (6 min)

Create `src/components/world/engine.ts`:

```ts
// An engine sound made with the Web Audio API: no audio files at all.
//
//   oscillator (a buzzing sawtooth wave) → low-pass filter (makes it a rumble)
//   → gain (volume) → speakers
//
// Browsers only allow sound after the visitor clicks or presses a key, so
// start() is called from the first click or key press.

/** The speed (m/s) at which each gear ends. */
const GEARS = [5, 9.5, 13.5, 17];

class EngineSound {
  private ctx: AudioContext | null = null;
  private osc: OscillatorNode | null = null;
  private gain: GainNode | null = null;
  enabled = true;

  start() {
    if (this.ctx) {
      void this.ctx.resume();
      return;
    }
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = 35;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 400;
    const gain = ctx.createGain();
    gain.gain.value = 0;

    osc.connect(filter).connect(gain).connect(ctx.destination);
    osc.start();
    this.ctx = ctx;
    this.osc = osc;
    this.gain = gain;
  }

  /** Called every frame with the car's speed. */
  update(speed: number) {
    if (!this.ctx || !this.osc || !this.gain) return;
    const s = Math.abs(speed);
    // Which gear are we in, and how far through it (0..1)?
    let gear = GEARS.findIndex((top) => s < top);
    if (gear < 0) gear = GEARS.length - 1;
    const low = gear === 0 ? 0 : GEARS[gear - 1];
    const through = Math.min((s - low) / (GEARS[gear] - low), 1);

    const now = this.ctx.currentTime;
    // setTargetAtTime glides to the new value instead of jumping (which clicks).
    this.osc.frequency.setTargetAtTime(34 + through * 70, now, 0.05);
    this.gain.gain.setTargetAtTime(this.enabled ? 0.04 + Math.min(s, 17) * 0.003 : 0, now, 0.08);
  }

  /** A short two-note horn. */
  horn() {
    if (!this.ctx || !this.enabled) return;
    const now = this.ctx.currentTime;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.02);
    gain.gain.setValueAtTime(0.08, now + 0.3);
    gain.gain.linearRampToValueAtTime(0, now + 0.35);
    gain.connect(this.ctx.destination);
    for (const frequency of [400, 500]) {
      const osc = this.ctx.createOscillator();
      osc.type = "square";
      osc.frequency.value = frequency;
      osc.connect(gain);
      osc.start(now);
      osc.stop(now + 0.36);
    }
  }
}

export const engineSound = new EngineSound();
```

> **Why `engine.ts` and not `sound.ts`?** We also have `Sound.tsx`. On macOS and Windows, file names that differ only in capital letters count as the **same file**, and TypeScript gets confused. Give them different names.

**Line by line:**

- `start()`:
  - Creates the `AudioContext`, the synthesiser, only once.
  - Then the chain: sawtooth at 35 Hz → low-pass at 400 Hz → gain at 0 (silent) → `ctx.destination` (the speakers).
  - `connect()` returns the node you connected to, so the chain reads left to right in one line.
  - `osc.start()` starts the wave running forever. We only change its pitch and volume.
  - If it already exists, `resume()` it: browsers suspend audio in background tabs.
- `update(speed)`:
  - **Gears:** a real engine's pitch rises with speed, then **drops** when it shifts up. We fake that: `GEARS` lists the speed where each gear ends. We find our gear and how far through it we are (0–1), and the pitch goes from 34 Hz up to 104 Hz within each gear. So you hear it rise, drop, rise, drop as you accelerate. That's what makes it sound like a car.
  - Volume grows a little with speed.
  - `setTargetAtTime(value, now, 0.05)` **glides** to the new value over about 50 ms. Setting `.value` directly jumps, and jumps make clicking noises.
- `horn()`:
  - Two square waves at 400 and 500 Hz (a slightly sour chord, like a real car horn) through one gain.
  - The gain follows an **envelope**: up quickly, hold, down quickly. That avoids clicks again.
  - `osc.stop(...)` stops them; stopped oscillators are cleaned up automatically.
- `export const engineSound = new EngineSound()` gives one shared engine for the whole app.

## Part 3: Wire it up (3 min)

Create `src/components/world/Sound.tsx`:

```tsx
"use client";

import { useEffect } from "react";
import { useFrame } from "@react-three/fiber";

import { engineSound } from "./engine";
import { car } from "./store";

/** Starts the sound on the first click or key press, then feeds it the car's speed. */
export default function Sound() {
  useEffect(() => {
    const start = () => engineSound.start();
    window.addEventListener("pointerdown", start);
    window.addEventListener("keydown", start);
    return () => {
      window.removeEventListener("pointerdown", start);
      window.removeEventListener("keydown", start);
    };
  }, []);

  useFrame(() => engineSound.update(car.speed));

  return null;
}
```

**Say:**

> This component draws nothing. It does two jobs: on the first click or key press, start the audio; then every frame, tell the engine the car's speed.

Add it to the scene:

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
import Sound from "./Sound";
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
      <Sound />
      {/* After the camera rig, so the signs use this frame's camera */}
      <SignTracker />
    </>
  );
}
```

And the horn on **H**, in the HUD's key handler:

```tsx
"use client";

import { useEffect } from "react";

import SectionContent from "@/components/SectionContent";
import { profile, sections } from "@/config/profile";
import { destinationById, destinations } from "./map";
import Minimap from "./Minimap";
import { engineSound } from "./engine";
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
  // Keyboard shortcuts: 1-3 drive to a place, Esc closes the panel, H honks.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (n >= 1 && n <= destinations.length) driveTo(destinations[n - 1].id);
      const { active } = worldStore.get();
      if (e.key === "Escape" && active) worldStore.set({ dismissed: active });
      if (e.code === "KeyH" && !e.repeat) engineSound.horn();
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

`!e.repeat` ignores the auto-repeat when the key is held, so it honks once per press.

## Checkpoint

- Click once, then drive: the engine idles, climbs, and drops at each gear change.
- H honks.

## Ideas for more sound (as on the real site)

- **A mute button** that remembers your choice in `localStorage`.
- **Tyre noise:** play "noise" (random numbers in an `AudioBuffer`) through a filter; louder with speed.
- **Arrival chime:** a sine wave with a slow fade-out sounds like a temple bell.
- **Ambience:** filtered noise for wind or lake waves; random short chirps for birds.

> On the real site all of these live in `src/components/city/audio.ts`, still with zero audio files.

## Common mistakes

| Problem | Fix |
| --- | --- |
| No sound at all | Audio only starts after a click or key press. Check `start()` is called from a real user event. |
| Clicking or popping | Use `setTargetAtTime` or ramps, never set `.value` directly while playing. |
| `Sound.tsx` and `sound.ts` errors | Rename one; case-only differences break on macOS and Windows. |

## Say (outro)

> Sound from pure maths! In the last episode we polish everything, make it fast on phones, and put it on the internet for everyone to see.
