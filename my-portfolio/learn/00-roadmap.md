# 0. Roadmap: What to Learn

You don't need to master everything below before starting. Learn each topic **when the series reaches it**; the "Needed for" column tells you when that is.

## Level 1: The web basics (before episode 1)

| Topic | Why you need it | Needed for | Resources |
| --- | --- | --- | --- |
| HTML & CSS | Everything on top of the 3D (panels, buttons) is HTML | Ep 1, 9 | [MDN: Learn web development](https://developer.mozilla.org/en-US/docs/Learn) |
| Modern JavaScript | Arrow functions, destructuring, `map`/`filter`, classes, modules | Every episode | [javascript.info](https://javascript.info) (free, excellent) |
| TypeScript | All the code is typed; types catch mistakes before the browser does | Every episode | [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html) |
| Git & GitHub | Save your work, deploy from GitHub | Ep 1, 14 | [GitHub Skills](https://skills.github.com) |

## Level 2: React and Next.js (before episode 1)

| Topic | Why you need it | Needed for | Resources |
| --- | --- | --- | --- |
| React components & props | The 3D scene is written as React components | Every episode | [react.dev/learn](https://react.dev/learn) |
| Hooks: `useState`, `useEffect`, `useRef`, `useMemo` | Refs hold 3D objects; effects add keyboard listeners | Ep 2, 5, 7 | [react.dev: Hooks reference](https://react.dev/reference/react/hooks) |
| Next.js App Router | Pages, layouts, server vs. client components | Ep 1 | [nextjs.org/learn](https://nextjs.org/learn), [Next.js docs](https://nextjs.org/docs) |
| Tailwind CSS | All the HUD styling | Ep 1, 9 | [tailwindcss.com/docs](https://tailwindcss.com/docs) |

**Key idea to understand first:** in Next.js, components run on the **server** by default. Anything that uses `window`, `document`, WebGL or the keyboard must be a **client component** (`"use client"` at the top). three.js can only run in the browser.

## Level 3: 3D graphics (from episode 2)

| Topic | Why you need it | Needed for | Resources |
| --- | --- | --- | --- |
| three.js basics: scene, camera, renderer, mesh = geometry + material | What everything is made of | Ep 2 | [three.js manual](https://threejs.org/manual/), [Discover three.js](https://discoverthreejs.com) (free book) |
| React Three Fiber (R3F) | Write three.js as JSX: `<mesh>`, `<boxGeometry>`, `useFrame` | Ep 2 onward | [R3F docs](https://r3f.docs.pmnd.rs), especially "Your first scene" and "Hooks" |
| Lights & shadows | Directional light, hemisphere light, shadow cameras | Ep 2 | three.js manual: "Lights" and "Shadows" |
| Textures | Drawing a brick pattern on a `<canvas>` and using it as a texture | Ep 2 | [MDN Canvas tutorial](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial) |
| Instancing | Drawing hundreds of copies in one draw call | Ep 5, 12 | three.js docs: `InstancedMesh` |
| Performance | Draw calls, shadow map size, pixel ratio | Ep 5, 14 | R3F docs: "Scaling performance" |

**Paid but worth it:** [Three.js Journey](https://threejs-journey.com) by Bruno Simon, the best structured three.js course. Bruno's own portfolio ([bruno-simon.com](https://bruno-simon.com)), a car you drive around, is the classic example of this kind of site.

## Level 4: Game maths (from episode 7)

You need less maths than you think. All of it is school-level trigonometry and vectors.

| Topic | Where it's used | Resources |
| --- | --- | --- |
| Vectors: add, subtract, length (`Math.hypot`), normalise | Moving, distances, pushing out of walls | Search YouTube for **"Freya Holmér Math for Game Devs"** (free, brilliant) |
| `sin`, `cos`, `atan2`: angle ↔ direction | Heading → movement; "which way is the target?" | [Khan Academy: Trigonometry](https://www.khanacademy.org/math/trigonometry) |
| Dot product / projecting a point on a line | Nearest point on a path or a box | Freya Holmér's videos, or the three.js `Vector3.dot` docs |
| The game loop and delta time | Same speed at 30 and 144 fps | [Game Programming Patterns: Game Loop](https://gameprogrammingpatterns.com/game-loop.html), [Fix Your Timestep!](https://gafferongames.com/post/fix_your_timestep/) |
| Smoothing with `damp` (exponential smoothing) | Camera, steering | Search for **"lerp smoothing is broken" Freya Holmér** |
| Kinematic bicycle model | How a car turns | Search for **"kinematic bicycle model"** |
| Graphs and Dijkstra's algorithm | The autopilot's route | [Red Blob Games: Introduction to A\*](https://www.redblobgames.com/pathfinding/a-star/introduction.html) (interactive, covers Dijkstra too) |
| Pure-pursuit steering | The autopilot following a route | Search for **"pure pursuit path tracking"** |

## Level 5: Sound (episode 13)

| Topic | Resources |
| --- | --- |
| Web Audio API: `AudioContext`, oscillators, filters, gain | [MDN: Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API), and its "Basic concepts" page |
| Why sound waits for a click (autoplay rules) | [MDN: Autoplay guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay) |

## Level 6: Going further (after the series)

| Topic | Resources |
| --- | --- |
| Animation on the classic page (scroll effects) | [GSAP docs](https://gsap.com/docs/v3/), [Motion](https://motion.dev) |
| Physics engines (for bouncy objects, the lanyard) | [@react-three/rapier](https://github.com/pmndrs/react-three-rapier) |
| Helpers for R3F (text, environment maps, controls) | [drei docs](https://drei.docs.pmnd.rs) |
| Shaders (custom water, wind in trees) | [The Book of Shaders](https://thebookofshaders.com) |
| Free 3D models instead of boxes | [Kenney assets](https://kenney.nl/assets), [Poly Pizza](https://poly.pizza) |
| Deploying | [Vercel docs](https://vercel.com/docs), and the Next.js deploying guide |
| Asking for help | [three.js forum](https://discourse.threejs.org); the Poimandres Discord (linked from the R3F docs) |

## A suggested 4-week plan

| Week | Learn | Build |
| --- | --- | --- |
| 1 | JavaScript + TypeScript basics, React basics | Episodes 1–2 |
| 2 | R3F docs "Getting started", three.js lights/shadows | Episodes 3–6 |
| 3 | Vectors + trig (Freya Holmér), game loop | Episodes 7–10 |
| 4 | Red Blob Games pathfinding, MDN Web Audio | Episodes 11–14, deploy |

## Say (for the roadmap video, about 3 minutes)

> In this series we're building a portfolio you can drive around in, a little Nepali town in 3D. Before we start, here's what you need to know, and don't worry, it's less than you think.
>
> First, you need the basics: HTML, CSS and JavaScript. If you can write a function, use an array's `map`, and build a small React component, you're ready for episode one.
>
> Second, React and Next.js. We'll use Next.js to make the website and React to describe the 3D world. Yes, the 3D world is just React components, like `<mesh>` instead of `<div>`.
>
> Third, the 3D part. We use three.js through a library called React Three Fiber. I'll explain every new idea as we go, but the free three.js manual and the R3F docs are great to read alongside.
>
> And finally, a little maths. To make a car turn, we need `sin` and `cos`. To find the shortest road, we use a famous algorithm called Dijkstra. I'll draw everything on screen and explain it simply. If you passed school maths, you can do this.
>
> All the links are in the description. Let's build it.
