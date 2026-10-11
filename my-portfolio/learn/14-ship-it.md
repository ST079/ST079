# Episode 14: Polish, Performance and Deploy

**Goal:** the site runs smoothly on phones, works for everyone, and is live on the internet with your own link.

**New ideas:** measuring performance, the cost of shadows and pixels, accessibility for a 3D site, deploying to Vercel.

---

## Part 1: Measure first (4 min)

**Show:** Chrome DevTools → Performance → record 5 seconds of driving. Then the **Rendering** tab → "Frame Rendering Stats".

**Say:**

> Never guess what's slow; measure it. Chrome DevTools can show your frame rate. At 60 fps, each frame has about 16 milliseconds. To test a slow phone on your laptop, use the Performance tab's **CPU throttling**.
>
> For 3D, the numbers that matter most are **draw calls** and **pixels**. We already cut draw calls with instancing and shared materials. Now pixels.

## Part 2: Performance checklist (5 min)

| Do this | Why | Where in our code |
| --- | --- | --- |
| Cap the pixel ratio | A phone at 3× draws 9× the pixels of 1× | `dpr={[1, 1.75]}` in `World.tsx` (the real site uses 1.5 on phones) |
| Smaller shadow map on phones | 2048² is 4 million pixels to render every frame | `shadow-mapSize` in `Scene.tsx` (the real site uses 1024 on phones) |
| Shadow box follows the car | A small box gives sharp shadows for less cost | The `Sun` component |
| Instancing | One draw call for many copies | `Houses.tsx`, `People.tsx` |
| Shared materials | Fewer material switches | `mat()` in `parts.tsx` |
| No React state per frame | React re-renders are slow; refs and plain objects are not | `store.ts`, `Signs.tsx`, `Minimap.tsx` |
| Load 3D only in the browser, in its own chunk | The page appears fast; three.js downloads after | `dynamic(..., { ssr: false })` in `ViewSwitch.tsx` |
| Fog | Hides the edge, and you can lower the camera's `far` | `Scene.tsx` |

**Say:**

> To use a different setting on phones, read a media query, for example `(pointer: fine) and (min-width: 900px)` for desktop, and pass different numbers into the canvas. The real site's `City.tsx` does exactly that.

## Part 3: Make it work for everyone (4 min)

**Say:**

> A 3D portfolio is fun, but your portfolio's real job is to be **read**, by recruiters on old laptops, by people using screen readers, by people on phones. So:

- **The classic page is always there** and server-rendered: search engines and screen readers get real HTML. (Episode 1.)
- **Every action has a button**: destinations, signs, the minimap. No one has to drive.
- **Real `<button>` elements** with `aria-label`s, and `inert` on the hidden layer.
- **Touch:** on phones, the destination bar and signs do everything. On the real site, keyboard hints are hidden on touch screens.
- **Respect "reduce motion":** for users with `prefers-reduced-motion`, consider skipping the camera swing or opening on the classic page.

## Part 4: Deploy to Vercel (5 min)

**Show:** the steps on screen.

```bash
git init
git add .
git commit -m "My 3D portfolio"
# create an empty repo on github.com, then:
git remote add origin https://github.com/<you>/my-3d-portfolio.git
git push -u origin main
```

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. **Add New → Project**, and pick your repository.
3. Leave the settings as they are (Vercel detects Next.js) and click **Deploy**.
4. In about a minute you get a link like `my-3d-portfolio.vercel.app`. Every `git push` updates it.

**Say:**

> Before deploying, always run `pnpm build` locally. It catches type errors and lint errors that the dev server lets slide.
>
> Add an icon: put an `icon.png` in `src/app/` and Next.js uses it as the browser tab icon.

## Part 5: Where to go next (2 min)

| Idea | How (and where on the real site) |
| --- | --- |
| More vehicles: bike, motorbike, tempo | One `VehicleSpec` per vehicle (wheelbase, top speed, body). See `city/scene/vehicles.tsx`. Two-wheelers lean into turns. |
| More places joined by roads | Add areas and roads to the map, and nodes and links to the graph. See `city/layout.ts`: Bhaktapur → Swayambhunath → Pokhara. |
| A lake path to cycle round | A loop of points round the shore, added to the graph. See `LAKE_PATH` in `layout.ts`. |
| Smarter people, animals, birds | `city/scene/Npcs.tsx`, `LakeLife.tsx` |
| Camera rises over trees | `firstCrown` in `city/scene/CameraRig.tsx` |
| Real 3D models | Download free `.glb` models (Kenney, Poly Pizza) and load them with drei's `useGLTF`. |
| An intro loader, scroll animations | GSAP and Motion on the classic page. |

## Say (series outro)

> And that's it: a portfolio you can drive around, made from boxes, a little maths and a lot of small ideas. Data in one map file. Fast state outside React. Instancing for crowds. Dijkstra for routes. Pure pursuit for steering. Web Audio for sound.
>
> If you build your own, put your hometown in it. I chose Bhaktapur, Swayambhunath and Pokhara because they're home. Drop your link in the comments; I'd love to drive around your town.
>
> Thanks for watching, and keep building.
