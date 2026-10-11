# Episode 1: Project Setup and the Two Views

**Goal:** a Next.js site with a normal, readable portfolio page, and a full-screen "3D world" layer on top of it, with a button to switch between them.

**New ideas:** server vs. client components, `"use client"`, `next/dynamic` with `ssr: false`, keeping content in one config file.

---

## Part 1: Intro (2 min)

**Show:** the finished site: drive around, open a panel, switch to the classic view.

**Say:**

> This is what we're building: a portfolio you can drive around in. Each building is one section: About me, Projects, Contact. Park next to it and that section opens. And if someone just wants to read, one click gives them a normal page.
>
> We'll build it from zero, one small step per video. Every line of code will be explained. You need basic JavaScript and a little React. Everything else, including the 3D maths, I'll teach as we go.

## Part 2: Create the project (3 min)

**Say:**

> First, let's create a Next.js project. Next.js is a React framework; it gives us pages, fast builds and easy deploying. Open a terminal and run this.

```bash
pnpm create next-app@latest my-3d-portfolio --yes --src-dir
cd my-3d-portfolio
pnpm add three @react-three/fiber @react-three/drei
pnpm add -D @types/three
pnpm dev
```

**Say:**

> `--yes` accepts the defaults: TypeScript, Tailwind CSS for styling, and ESLint to catch mistakes. `--src-dir` puts our code in a `src` folder.
>
> Then we install three packages. **three** is three.js, the library that draws 3D in the browser using WebGL. **@react-three/fiber**, "R3F" for short, lets us write three.js as React components. And **drei** is a box of handy helpers for R3F. `@types/three` gives TypeScript the types for three.js.
>
> Run `pnpm dev`, open localhost:3000, and you'll see the Next.js starter page.

> **No pnpm?** Use `npx create-next-app@latest ...` and `npm install ...` instead. Everything else is the same.

## Part 3: Content lives in one file (3 min)

**Say:**

> Before any 3D, here's a rule that will save you a lot of time: **keep all your words in one file.** The 3D panels and the classic page will both read from it. Change your bio once, and it changes everywhere.

Create `src/config/profile.ts`:

```ts
// All the portfolio's words live here. The 3D panels and the classic page
// both read this file, so you only ever edit text in one place.

export type SectionId = "about" | "projects" | "contact";

export const profile = {
  name: "Your Name",
  role: "Backend Engineer",
};

export const sections: Record<SectionId, { title: string; lines: string[] }> = {
  about: {
    title: "About me",
    lines: [
      "I build backend systems with C#, .NET and PostgreSQL.",
      "I live in Bhaktapur, Nepal, and I love explaining how things work.",
    ],
  },
  projects: {
    title: "Projects",
    lines: [
      "Order service: an event-driven API with Kafka and Redis.",
      "This website: a small 3D town built with React Three Fiber.",
    ],
  },
  contact: {
    title: "Contact",
    lines: ["Email: you@example.com", "GitHub: github.com/your-name"],
  },
};
```

**Line by line:**

- `export type SectionId = "about" | "projects" | "contact";` is a **union type**: a `SectionId` can only be one of these three strings. If you mistype `"projcts"` anywhere, TypeScript underlines it in red.
- `profile` holds your name and job title.
- `sections` is a `Record<SectionId, ...>`: an object with exactly one entry per section id. Forget one and TypeScript complains.
- Each section has a `title` and some `lines` of text. Keep it simple for now; you can add links and images later.

Now a component that shows one section's text. Create `src/components/SectionContent.tsx`:

```tsx
import { sections, type SectionId } from "@/config/profile";

/** One section's text. Used by the classic page and by the 3D panel. */
export default function SectionContent({ id }: { id: SectionId }) {
  return (
    <ul className="space-y-2">
      {sections[id].lines.map((line) => (
        <li key={line} className="leading-relaxed">
          {line}
        </li>
      ))}
    </ul>
  );
}
```

**Say:**

> This is a tiny component. Give it an id, and it lists that section's lines. The `key` on each `<li>` helps React keep track of list items; we use the line itself because each line is different.

## Part 4: The classic page (2 min)

Replace `src/app/page.tsx`:

```tsx
import SectionContent from "@/components/SectionContent";
import ViewSwitch from "@/components/ViewSwitch";
import { profile, sections, type SectionId } from "@/config/profile";

export default function Home() {
  const ids = Object.keys(sections) as SectionId[];

  return (
    // The 3D world is shown on top; this plain page is always underneath it.
    <ViewSwitch>
      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-4xl font-bold">{profile.name}</h1>
        <p className="mt-2 text-lg text-neutral-600">{profile.role}</p>

        {ids.map((id) => (
          <section key={id} id={id} className="mt-12">
            <h2 className="mb-3 text-2xl font-semibold">{sections[id].title}</h2>
            <SectionContent id={id} />
          </section>
        ))}
      </main>
    </ViewSwitch>
  );
}
```

**Say:**

> This is the normal page: your name, your role, then every section. `Object.keys(sections)` gives us `["about", "projects", "contact"]`. We tell TypeScript they're `SectionId`s with `as SectionId[]`.
>
> Notice there's no `"use client"` at the top. That means this is a **server component**: Next.js turns it into HTML on the server. That's good for search engines. Google can read your portfolio even though the 3D part is JavaScript.
>
> We wrap everything in `<ViewSwitch>`, which we write next.

Also tidy up `src/app/layout.tsx` (only the metadata changes from the starter):

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "My 3D Portfolio",
  description: "Drive around a small Nepali town to read my portfolio.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

And replace `src/app/globals.css` with the plain version:

```css
@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #171717;
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: Arial, Helvetica, sans-serif;
}
```

## Part 5: Switching between the 3D world and the page (5 min)

**Say:**

> Now the important part. three.js needs the browser: it uses `window`, `document` and the graphics card. On the server none of those exist. So we must load the 3D world **only in the browser**. Next.js has a tool for that: `dynamic` with `ssr: false`.

Create `src/components/ViewSwitch.tsx`:

```tsx
"use client";

import { useEffect, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";

// three.js only works in the browser, so the world loads client-side only,
// in its own chunk. While it downloads we show a plain background.
const World = dynamic(() => import("@/components/world/World"), {
  ssr: false,
  loading: () => <div className="fixed inset-0 z-50 bg-[#efe6d6]" />,
});

/** Shows the 3D world over the classic page, with a button to switch between them. */
export default function ViewSwitch({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<"world" | "classic">("world");

  // While the world covers the page, stop the page underneath from scrolling.
  useEffect(() => {
    if (mode !== "world") return;
    const { style } = document.documentElement;
    style.overflow = "hidden";
    return () => {
      style.overflow = "";
    };
  }, [mode]);

  return (
    <>
      {mode === "world" && <World onExit={() => setMode("classic")} />}

      {/* `inert` makes the hidden page unclickable and skipped by Tab. */}
      <div inert={mode === "world"}>{children}</div>

      {mode === "classic" && (
        <button
          type="button"
          onClick={() => setMode("world")}
          className="fixed right-4 top-4 rounded-full border bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-neutral-100"
        >
          Back to 3D
        </button>
      )}
    </>
  );
}
```

**Line by line:**

- `"use client"` marks this as a **client component**: it runs in the browser, so it can use `useState`, `useEffect` and click handlers.
- `dynamic(() => import(...), { ssr: false })` loads `World` as a separate JavaScript file, only in the browser. The big three.js library isn't in the first download of the page, so the page shows up fast.
- `loading: () => <div ... />` is what shows while that file downloads: a plain beige screen the same colour as our sky, so there's no flash.
- `useState<"world" | "classic">("world")` sets which view is showing. The 3D world is first.
- The `useEffect` stops the page underneath from scrolling while the world covers it. The function it returns runs when `mode` changes, and turns scrolling back on.
- `inert={mode === "world"}` makes the hidden page unclickable and skipped by the Tab key. Good for keyboard and screen-reader users.
- In classic mode, a "Back to 3D" button switches back.

Finally, a placeholder world, so we can test the switch. Create `src/components/world/World.tsx`:

```tsx
"use client";

/** The 3D world. For now, just a placeholder with a way out. */
export default function World({ onExit }: { onExit: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#efe6d6]">
      <p className="text-2xl font-semibold">The 3D world goes here</p>
      <button
        type="button"
        onClick={onExit}
        className="absolute right-5 top-5 rounded-full bg-white px-4 py-2 text-sm font-medium shadow-sm"
      >
        Classic view
      </button>
    </div>
  );
}
```

## Checkpoint

- The page opens on a beige screen saying "The 3D world goes here".
- **Classic view** shows your name and three sections.
- **Back to 3D** brings the beige screen back.
- Right-click → View Page Source: your name and sections are in the HTML. That's the server rendering.

## Common mistakes

| Problem | Fix |
| --- | --- |
| `ReferenceError: window is not defined` | A component using the browser is missing `"use client"`, or `World` was imported normally instead of with `dynamic(..., { ssr: false })`. |
| `ssr: false is not allowed with next/dynamic in Server Components` | `dynamic(... ssr: false)` must be inside a `"use client"` file, like `ViewSwitch.tsx`. |
| Red squiggle on `inert` | Update `@types/react` to version 19 (the starter already has it). |

## Say (outro)

> We have a project, our content in one place, and a switch between two views. Next time, the fun starts: our first 3D scene, with a brick square, sunlight and real shadows.
