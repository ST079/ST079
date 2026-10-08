# ST079 — Sujan Tamang's Portfolio

Personal portfolio site for **Sujan Tamang**, a junior backend developer working with C#, .NET and PostgreSQL.

On large screens, scrolling down moves the page sideways through full-screen panels. A physics-driven 3D badge hangs from the top of the hero, and a floating dock at the bottom handles navigation.

## Features

- **Intro overlay**: an animated "ST079" loader that wipes away to reveal the site. The page renders underneath it, so content is server-rendered and the 3D scene loads while the intro plays.
- **Horizontal scroll (lg+)**: GSAP ScrollTrigger pins the page and slides the panels sideways. Elements marked with `data-reveal` fade in as they enter. On smaller screens the panels stack normally.
- **3D lanyard badge**: React Three Fiber and Rapier physics. Visitors can drag the card. Custom front and back images are composited onto the card texture. It loads lazily and only mounts on large screens.
- **Navigation dock**: a magnifying dock with tooltips that highlights the section currently on screen. Its links scroll smoothly, including into the horizontal panels.
- **Tech stack marquee**: an infinitely scrolling strip of logos.
- **Hand-drawn highlights**: rough-notation underlines and highlights that start once the intro has gone.

## Tech stack

| Area      | Tools                                                           |
| --------- | --------------------------------------------------------------- |
| Framework | Next.js 16 (App Router, Turbopack), React 19, TypeScript        |
| Styling   | Tailwind CSS v4, shadcn/ui (Base UI), `tw-animate-css`          |
| Animation | GSAP + ScrollTrigger (`@gsap/react`), Motion, rough-notation    |
| 3D        | three.js, React Three Fiber, drei, `@react-three/rapier`, meshline |
| Icons     | lucide-react, react-icons                                       |

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
│   │   ├── page.tsx          # Home page: dock + horizontal panels
│   │   └── globals.css       # Tailwind + shadcn theme tokens
│   ├── assets/
│   │   └── lanyard/          # Front/back images printed on the badge
│   ├── components/
│   │   ├── Highlight.tsx     # Highlighter that waits for the intro to finish
│   │   ├── icons/            # Brand SVG icons (GitHub, LinkedIn)
│   │   ├── intro/            # Intro overlay: IntroGate, IntroLoader, Loader
│   │   ├── lanyard/          # 3D badge (Lanyard) + lazy, desktop-only wrapper
│   │   ├── layout/           # HorizontalScroll, NavigationDock
│   │   ├── sections/         # Page panels: HeroSection, AboutSection
│   │   └── ui/               # Reusable primitives (dock, tooltip, highlighter, logo-loop)
│   ├── config/
│   │   ├── site.ts           # Site title, nav links, socials, intro and lanyard settings
│   │   └── tech-stack.tsx    # Logos shown in the tech stack marquee
│   ├── hooks/
│   │   ├── use-active-section.ts  # Which section is on screen (for the dock)
│   │   └── use-media-query.ts     # Live CSS media query match
│   └── lib/
│       └── utils.ts          # `cn()` class-name helper
├── components.json           # shadcn/ui config (aliases match the folders above)
├── next.config.ts
└── tsconfig.json
```

### Where things go

- **`components/ui/`**: generic building blocks with no site content, mostly added through the shadcn CLI or registries (`@magicui`, `@react-bits`). File names are kebab-case.
- **`components/sections/`**: one component per full-screen panel. Each one is a `<section id="...">`.
- **`components/layout/`**: page chrome that wraps or floats over the sections.
- **`config/`**: content and settings. Edit text, links and images here rather than inside components.

## Customising

**Text and links.** Edit [`src/config/site.ts`](src/config/site.ts). It holds the page title and description, the author name, the social links and the intro duration.

**Tech stack logos.** Edit [`src/config/tech-stack.tsx`](src/config/tech-stack.tsx). Icons come from `react-icons/si`.

**Badge images.** Replace `src/assets/lanyard/card-front.png` and `card-back.png`. The model and strap texture are in `public/lanyard/`.

**Adding a new section**

1. Create `src/components/sections/ProjectsSection.tsx`. The root should be a `<section id="projects">`. To make it a horizontal panel on large screens, give it `lg:h-screen lg:w-screen lg:shrink-0`.
2. Add it inside `<HorizontalScroll>` in [`src/app/page.tsx`](src/app/page.tsx), or after it if it should scroll vertically.
3. Add `{ id: "projects", label: "Projects", icon: FolderGit2 }` to `navigation.sections` in `site.ts`. The dock picks it up automatically.
4. Optionally add `data-reveal` to elements inside it so they animate in.

## Notes

- This project uses **Next.js 16**, whose APIs differ from older versions. Check `node_modules/next/dist/docs/` before relying on older patterns (see `AGENTS.md`).
- The horizontal scroll, the lanyard and the dock's scroll-to-panel behaviour only run at `min-width: 1024px` (Tailwind's `lg`). Below that the site is a normal vertical page.
- `prefers-reduced-motion` stops the logo marquee.
