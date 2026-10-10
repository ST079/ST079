# ST079 — Sujan Tamang's Portfolio

Personal portfolio site for **Sujan Tamang**, a junior backend engineer working with C#, .NET, GraphQL, PostgreSQL and Kafka.

The site has two views. It opens in a small 3D town modelled on Bhaktapur Durbar Square, where visitors drive a car to landmarks that each hold a part of the portfolio. One click switches to the classic page, a scrolling site with the same content and a few interactive extras.

## Features

### The town (first view)

- **Drive or take the autopilot**: WASD or the arrow keys drive and Space brakes. Clicking a place in the destination bar, or pressing 1 to 6, drives there automatically.
- **Landmarks as sections**: About, Experience, Projects, Skills, Education and Contact each live at a landmark, such as the 55-Window Palace or Nyatapola. Arriving opens that section in a panel. Escape closes it and E reopens it.
- **Garage**: pick a hatchback, taxi, jeep or tempo. The choice is remembered.
- **Chase camera and minimap**: the camera follows behind the car and avoids clipping into buildings. The minimap shows where everything is.
- **Life on the square**: tourists, cats, dogs and pigeons wander around.

### The classic page

- **Intro overlay**: an animated "ST079" loader that wipes away to reveal the site.
- **3D lanyard badge**: React Three Fiber and Rapier physics. Visitors can drag the card. It loads lazily and only on large screens.
- **"How I work" band**: a short statement whose words light up as you scroll through it (GSAP SplitText).
- **Sideways experience**: the roles sit as cards in a row along a timeline. On large screens GSAP ScrollTrigger pins the section while you scroll down, the cards slide past and the timeline fills. On smaller or short screens, or with reduced motion, the row scrolls sideways by swipe or trackpad instead.
- **Projects**: category filters with animated re-layout, and cards that tilt and light up under the cursor.
- **Skills playground**: the skills drop as physics bodies (matter-js) that can be thrown around.
- **Momo, the sidekick**: a small animated character that sits on the heading of the section you're reading and hops over to the next heading as you scroll. Once that heading scrolls off the top, Momo waits at the side of the screen, peeking at the page, until the next heading comes into view. It greets visitors, comments on each section the first time it lands there, follows the mouse with its eyes, naps when nobody's around, and gives tips when clicked. Visitors can hide it for the rest of their visit.
- **Navigation dock**: a magnifying dock that highlights the section on screen.
- **Tech stack marquee**: an infinitely scrolling strip of logos in the hero.
- **Hand-drawn highlights**: rough-notation underlines and highlights that start once the intro has gone.

## Tech stack

| Area      | Tools                                                                |
| --------- | -------------------------------------------------------------------- |
| Framework | Next.js 16 (App Router, Turbopack), React 19, TypeScript             |
| Styling   | Tailwind CSS v4, shadcn/ui (Base UI), `tw-animate-css`               |
| Animation | GSAP (ScrollTrigger, SplitText) with `@gsap/react`, Motion, rough-notation |
| 3D        | three.js, React Three Fiber, drei, `@react-three/rapier`, meshline   |
| Physics   | matter-js (skills playground), Rapier (lanyard)                      |
| Character | `@bible-strong/avatar-react` (Momo)                                  |
| Icons     | lucide-react, react-icons                                            |

## Getting started

Requires Node.js 20+ and [pnpm](https://pnpm.io).

```bash
pnpm install
pnpm dev      # http://localhost:3000
```

| Script       | What it does                       |
| ------------ | ---------------------------------- |
| `pnpm dev`   | Start the dev server               |
| `pnpm build` | Production build                   |
| `pnpm start` | Serve the production build         |
| `pnpm lint`  | Run ESLint                         |

## Project structure

All source code lives in `src/`. The `@/*` import alias points to `src/*`, so `@/components/ui/dock` resolves to `src/components/ui/dock.tsx`.

```
my-portfolio/
├── public/
│   └── lanyard/              # 3D badge model (card.glb) and strap texture
├── src/
│   ├── app/
│   │   ├── layout.tsx        # Root layout: font, metadata, IntroGate
│   │   ├── page.tsx          # Home page: view switcher, dock, Momo, sections
│   │   └── globals.css       # Tailwind + shadcn theme tokens
│   ├── assets/
│   │   └── lanyard/          # Front/back images printed on the badge
│   ├── components/
│   │   ├── city/             # The 3D town
│   │   │   ├── City.tsx      # Canvas, scene and HUD
│   │   │   ├── layout.ts     # The map: landmarks, roads, houses, route planner
│   │   │   ├── store.ts      # Shared state: car, chosen vehicle, autopilot target
│   │   │   ├── signs.tsx     # Floating landmark signs
│   │   │   ├── hud/          # Welcome card, garage, destination bar, panels, minimap
│   │   │   └── scene/        # Car, camera, houses, people and animals, buildings/
│   │   ├── content/          # Section content, shared by the town's panels and the classic page
│   │   ├── icons/            # Brand SVG icons (GitHub, LinkedIn)
│   │   ├── intro/            # Intro overlay: IntroGate, IntroLoader, Loader
│   │   ├── lanyard/          # 3D badge (Lanyard) + lazy, desktop-only wrapper
│   │   ├── layout/           # ViewModeShell (town/classic switch), NavigationDock
│   │   ├── sections/         # Classic page sections, the "How I work" band, sideways Experience, skills playground
│   │   ├── sidekick/         # Momo: character (momo.avatar.json), behaviour, and the Perch spots on headings
│   │   ├── ui/               # Reusable primitives (dock, tooltip, falling-text, tilt-card, …)
│   │   ├── Highlight.tsx     # Highlighter that waits for the intro to finish
│   │   └── Reveal.tsx        # Fades content in as it scrolls into view
│   ├── config/
│   │   ├── profile.ts        # All the portfolio content: bio, experience, projects, skills, …
│   │   ├── site.ts           # Site title, nav links, socials, intro and lanyard settings
│   │   └── tech-stack.tsx    # Logos shown in the tech stack marquee
│   ├── hooks/
│   │   ├── use-active-section.ts  # Which section is on screen (for the dock and Momo)
│   │   └── use-media-query.ts     # Live CSS media query match
│   └── lib/
│       ├── scroll-to-section.ts  # Smooth jumps to a section (used by the dock and hero)
│       └── utils.ts          # `cn()` class-name helper
├── components.json           # shadcn/ui config (aliases match the folders above)
├── LICENSE                   # GNU AGPL v3
├── next.config.ts
└── tsconfig.json
```

### Where things go

- **`config/`**: content and settings. Edit text, links and images here rather than inside components.
- **`components/content/`**: what each section says. Both views render these, so a change shows up in the town's panels and on the classic page.
- **`components/sections/`**: the classic page's layout around that content. Each one is a `<section id="...">`.
- **`components/city/`**: everything specific to the 3D town.
- **`components/layout/`**: page chrome that wraps or floats over the sections.
- **`components/ui/`**: generic building blocks with no site content, mostly from the shadcn CLI or registries (`@magicui`, `@react-bits`). File names are kebab-case.

## Customising

**Text, experience, projects and skills.** Edit [`src/config/profile.ts`](src/config/profile.ts). Each project has a `category` for the filters, an `icon` and a `color`.

**Title, navigation and socials.** Edit [`src/config/site.ts`](src/config/site.ts). It also holds the intro duration and the badge images.

**Tech stack logos.** Edit [`src/config/tech-stack.tsx`](src/config/tech-stack.tsx). Icons come from `react-icons/si`.

**Badge images.** Replace `src/assets/lanyard/card-front.png` and `card-back.png`. The model and strap texture are in `public/lanyard/`.

**Momo.** The look, expressions and animations are in [`src/components/sidekick/momo.avatar.json`](src/components/sidekick/momo.avatar.json). What Momo says per section, and its tips, are at the top of [`Sidekick.tsx`](src/components/sidekick/Sidekick.tsx). Momo can sit on any heading wrapped in `<Perch section="…">`. The `Section` component already does this, so new sections get a spot automatically.

**Adding a new section**

1. Write its content in `src/components/content/`, reading text from `profile.ts`.
2. Wrap it in `<Section id="talks" eyebrow="Talks" title="…">` inside `ContentSections.tsx`, and add it to [`src/app/page.tsx`](src/app/page.tsx).
3. Add `{ id: "talks", label: "Talks", icon: Mic }` to `navigation.sections` in `site.ts`. The dock picks it up automatically.
4. Optionally give it a place in the town: add a destination in `city/layout.ts` and map its id to the content in `city/hud/Panel.tsx`.

## Notes

- This project uses **Next.js 16**, whose APIs differ from older versions. Check `node_modules/next/dist/docs/` before relying on older patterns (see `AGENTS.md`).
- The pinned Experience section needs a screen at least 1024px wide (Tailwind's `lg`) and 700px tall. The lanyard only runs at `lg` and up.
- With `prefers-reduced-motion`, the marquee stops, the "How I work" words show fully lit, the skills show as plain chips, the cards don't tilt, and Momo holds still.

## License

This project is licensed under the [GNU Affero General Public License v3.0](LICENSE) (AGPL-3.0-only).

It uses the AGPL because Momo is drawn with [`@bible-strong/avatar-react`](https://www.npmjs.com/package/@bible-strong/avatar-react), which is AGPL-3.0-only. The AGPL asks that anyone who runs a modified copy as a public website offers its visitors the source code.
