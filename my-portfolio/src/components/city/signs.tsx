"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { DESTINATION_ICONS } from "./icons";
import { destinations, HILL, type DestinationId } from "./layout";
import { driveTo } from "./store";

// Floating signs above the destination buildings. They are plain HTML in the
// page's own React tree, positioned every frame from the 3D camera by
// <SignTracker> (which runs inside the canvas). Doing it by hand instead of
// with drei's <Html> avoids one extra React root per sign.

const elements = new Map<DestinationId, HTMLElement>();
/** Signs start fading at this distance from the camera, and are gone by the next. */
const FADE_FROM = 110;
const FADE_TO = 150;

const sample = new THREE.Vector3();

/**
 * True if Swayambhu's hill (or the stupa on it) stands between the camera and
 * the sign. The signs are HTML, so nothing in the 3D scene hides them; the
 * hill is the one thing big enough to need it.
 */
function behindHill(from: THREE.Vector3, to: THREE.Vector3) {
  const [cx, cz] = HILL.center;
  for (let t = 0.05; t < 0.96; t += 0.05) {
    sample.lerpVectors(from, to, t);
    const d = Math.hypot(sample.x - cx, sample.z - cz);
    // The hill narrows from its foot to its top; the stupa's dome sits on top.
    if (sample.y < HILL.height && d < HILL.radius - ((HILL.radius - HILL.topRadius) * sample.y) / HILL.height - 1) return true;
    if (sample.y >= HILL.height && sample.y < HILL.height + 6.4 && d < 5.3) return true;
  }
  return false;
}

/** Lives inside the <Canvas>; mount it after the camera rig so it uses this frame's camera. */
export function SignTracker() {
  const point = useRef(new THREE.Vector3());
  const shown = useRef(new Map<DestinationId, number>());

  useFrame(({ camera, size }, dt) => {
    for (const d of destinations) {
      const el = elements.get(d.id);
      if (!el) continue;
      const p = point.current.set(d.center[0], d.signHeight, d.center[1]);
      const distance = p.distanceTo(camera.position);
      // Fade out far away (the other place's signs would otherwise float
      // over this one's hills) and behind Swayambhu's hill, easing so they
      // don't pop. Hidden signs can't be clicked either.
      const target = behindHill(camera.position, p) ? 0 : THREE.MathUtils.clamp((FADE_TO - distance) / (FADE_TO - FADE_FROM), 0, 1);
      p.project(camera);
      const opacity = p.z > 1 ? 0 : THREE.MathUtils.damp(shown.current.get(d.id) ?? target, target, 8, dt);
      shown.current.set(d.id, opacity);
      el.style.visibility = opacity > 0.02 ? "visible" : "hidden";
      if (opacity <= 0.02) continue;
      const x = ((p.x + 1) / 2) * size.width;
      const y = ((1 - p.y) / 2) * size.height;
      const scale = THREE.MathUtils.clamp(44 / distance, 0.5, 1.05);
      el.style.opacity = String(opacity);
      el.style.zIndex = String(1000 - Math.round(distance));
      el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${scale})`;
    }
  });

  return null;
}

/** The sign buttons themselves; clicking one drives there. Rendered over the canvas. */
export function Signs() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      {destinations.map((d) => {
        const Icon = DESTINATION_ICONS[d.id];
        return (
          <button
            key={d.id}
            ref={(el) => {
              if (el) elements.set(d.id, el);
              else elements.delete(d.id);
            }}
            type="button"
            onClick={(e) => {
              driveTo(d.id);
              e.currentTarget.blur();
            }}
            className="pointer-events-auto absolute left-0 top-0 flex origin-center items-center gap-2 whitespace-nowrap rounded-full bg-white/95 py-1.5 pl-1.5 pr-4 text-left opacity-0 shadow-md ring-1 ring-black/5 will-change-transform"
          >
            <span
              className="flex size-8 items-center justify-center rounded-full text-white"
              style={{ background: d.color }}
            >
              <Icon className="size-4" aria-hidden />
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-semibold text-slate-900">{d.section}</span>
              <span className="block text-xs text-slate-500">{d.place}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
