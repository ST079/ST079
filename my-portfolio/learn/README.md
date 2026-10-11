# Build a 3D Drivable Portfolio: Course Guide

A complete, step-by-step guide (and video script) for building a portfolio you can **drive around in**: a small 3D Nepali town where each landmark opens a section of your portfolio.

This is the teaching version of [my own portfolio](../README.md). In the series we build a smaller, simpler town from scratch: one brick square, a pagoda, a Newa home, a lake with boats, people walking about, a car you can drive or send on autopilot, a minimap, floating signs and engine sound. Once you understand it, the real site is the same ideas used many more times.

## How to use this folder

| File | What it's for |
| --- | --- |
| [00-roadmap.md](00-roadmap.md) | What to learn before and during the series, with free and paid resources |
| `01-...` to `14-...` | One file per video. Each has the goal, **what to say on camera**, the code, a line-by-line explanation, a checkpoint and common mistakes |
| [99-final-code.md](99-final-code.md) | Every finished file in full, so viewers can compare their code |

Every episode follows the same layout:

- **Goal**: what works at the end of the video.
- **Say**: the script, in simple words. Read it as it is or put it in your own words.
- **Show**: what to have on screen while you say it.
- **Code**: what to type, with an explanation after it.
- **Checkpoint**: what viewers should see in the browser before moving on.
- **Common mistakes**: the errors viewers will hit, and the fix.

## The series

| # | Episode | You learn | Length (approx.) |
| --- | --- | --- | --- |
| 0 | [Roadmap](00-roadmap.md) | What to learn, and where | read only |
| 1 | [Project setup and the two views](01-setup.md) | Next.js, Tailwind, client-only components, `dynamic()` | 15 min |
| 2 | [Your first 3D scene](02-first-scene.md) | Canvas, meshes, lights, shadows, fog, canvas textures | 20 min |
| 3 | [The map is just data](03-map-data.md) | Coordinates, rectangles, seeded random, procedural houses | 15 min |
| 4 | [Building a pagoda from boxes](04-buildings.md) | Groups, reusable parts, shared materials | 15 min |
| 5 | [A hundred houses, one draw call](05-instancing.md) | InstancedMesh, matrices, per-instance colour | 15 min |
| 6 | [Shared state without re-renders](06-state.md) | Mutable objects vs. React state, `useSyncExternalStore` | 15 min |
| 7 | [Driving the car](07-car.md) | Game loop, keyboard input, the bicycle model, collisions | 25 min |
| 8 | [A chase camera](08-camera.md) | Frame-rate independent smoothing, camera collision | 15 min |
| 9 | [Landmarks open your portfolio](09-destinations.md) | Parking detection, HTML panels over 3D | 15 min |
| 10 | [Autopilot: path finding and steering](10-autopilot.md) | Graphs, Dijkstra, pure-pursuit steering | 25 min |
| 11 | [Floating signs and a minimap](11-signs-minimap.md) | 3D → screen projection, SVG viewBox | 15 min |
| 12 | [Bringing the town to life](12-life.md) | Animated instances, simple AI, a lake with boats | 20 min |
| 13 | [Engine sound with no audio files](13-sound.md) | Web Audio API: oscillators, filters, gain | 15 min |
| 14 | [Polish, performance and deploy](14-ship-it.md) | Profiling, mobile, Vercel, where to go next | 15 min |

## What viewers build

```
my-3d-portfolio/
├── src/
│   ├── app/
│   │   ├── layout.tsx            # page shell and <title>
│   │   ├── page.tsx              # classic page under the 3D world
│   │   └── globals.css
│   ├── config/
│   │   └── profile.ts            # every word of the portfolio
│   └── components/
│       ├── SectionContent.tsx    # one section's text (used by both views)
│       ├── ViewSwitch.tsx        # 3D world ⇄ classic page
│       └── world/
│           ├── World.tsx         # <Canvas> + HTML layers
│           ├── Scene.tsx         # lights, fog, and everything in the world
│           ├── map.ts            # the map as data + route planner
│           ├── store.ts          # shared state
│           ├── parts.tsx         # Box, Roof, shared materials
│           ├── Ground.tsx        # grass + brick square
│           ├── Buildings.tsx     # pagoda + Newa home
│           ├── Houses.tsx        # instanced row houses
│           ├── Car.tsx           # driving, autopilot, collisions
│           ├── CameraRig.tsx     # chase camera
│           ├── Lake.tsx          # water, island, boats
│           ├── People.tsx        # instanced crowd
│           ├── Signs.tsx         # HTML signs that follow 3D points
│           ├── Minimap.tsx       # SVG map
│           ├── Hud.tsx           # panel, buttons, keyboard shortcuts
│           ├── engine.ts         # Web Audio engine sound
│           └── Sound.tsx         # starts the sound, feeds it the speed
```

About 1,300 lines in total. Every file has been type-checked, linted, built and run in a browser at 60 fps.

## Tested with

| Tool | Version |
| --- | --- |
| Node.js | 20.9 or newer |
| Next.js | 16.3 |
| React | 19.2 |
| three | 0.186 |
| @react-three/fiber | 9.x |
| Tailwind CSS | 4.x |

> **Tip for the videos:** pin these versions in the description. 3D libraries change often, and most "it doesn't work" comments come from a different version.

## Map from the course to the real site

When viewers ask "how did you do X on your site?", point them here:

| On the real site | Builds on episode | Where it lives |
| --- | --- | --- |
| Six vehicles, leaning bikes | 7 | `src/components/city/scene/vehicles.tsx`, `Car.tsx` |
| Three towns joined by roads | 3, 10 | `src/components/city/layout.ts` |
| Camera rising over trees | 8 | `src/components/city/scene/CameraRig.tsx` |
| Pokhara lake, cycle path, boats | 12 | `src/components/city/scene/Pokhara.tsx`, `LakeLife.tsx` |
| Tourists, dogs, monkeys | 12 | `src/components/city/scene/Npcs.tsx` |
| Gears, bells, birds, waves | 13 | `src/components/city/audio.ts` |
| Intro loader, lanyard badge, Momo | not covered | `src/components/intro`, `lanyard`, `sidekick` |
