"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { DESTINATION_ICONS } from "./icons";
import { destinations, type DestinationId } from "./layout";
import { driveTo } from "./store";

// Floating signs above the destination buildings. They are plain HTML in the
// page's own React tree, positioned every frame from the 3D camera by
// <SignTracker> (which runs inside the canvas). Doing it by hand instead of
// with drei's <Html> avoids one extra React root per sign.

const elements = new Map<DestinationId, HTMLElement>();

/** Lives inside the <Canvas>; mount it after the camera rig so it uses this frame's camera. */
export function SignTracker() {
  const point = useRef(new THREE.Vector3());

  useFrame(({ camera, size }) => {
    for (const d of destinations) {
      const el = elements.get(d.id);
      if (!el) continue;
      const p = point.current.set(d.center[0], d.signHeight, d.center[1]);
      const distance = p.distanceTo(camera.position);
      p.project(camera);
      if (p.z > 1) {
        el.style.opacity = "0";
        continue;
      }
      const x = ((p.x + 1) / 2) * size.width;
      const y = ((1 - p.y) / 2) * size.height;
      const scale = THREE.MathUtils.clamp(44 / distance, 0.5, 1.05);
      el.style.opacity = "1";
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
