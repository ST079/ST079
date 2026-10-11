"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { crownOf, destinationById, SHADE_TREES, solids } from "../layout";
import { car, cityStore, view, zoomBy } from "../store";
import { vehicleById } from "./vehicles";

const wrapAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

function dampVector(v: THREE.Vector3, target: THREE.Vector3, lambda: number, dt: number) {
  v.x = THREE.MathUtils.damp(v.x, target.x, lambda, dt);
  v.y = THREE.MathUtils.damp(v.y, target.y, lambda, dt);
  v.z = THREE.MathUtils.damp(v.z, target.z, lambda, dt);
}

/**
 * Where (0..1) the ground segment from (px, pz) by (dx, dz) first enters a
 * building taller than `height`, or Infinity if it doesn't.
 */
function firstHit(px: number, pz: number, dx: number, dz: number, height: number) {
  let nearest = Infinity;
  for (const s of solids) {
    if (s.height < height - 0.5) continue; // the camera passes over it
    const minX = s.center[0] - s.size[0] / 2 - 0.6;
    const maxX = s.center[0] + s.size[0] / 2 + 0.6;
    const minZ = s.center[1] - s.size[1] / 2 - 0.6;
    const maxZ = s.center[1] + s.size[1] / 2 + 0.6;
    if (px > minX && px < maxX && pz > minZ && pz < maxZ) continue;
    let t0 = 0;
    let t1 = 1;
    for (const [p, d, lo, hi] of [
      [px, dx, minX, maxX],
      [pz, dz, minZ, maxZ],
    ]) {
      if (Math.abs(d) < 1e-6) {
        if (p < lo || p > hi) {
          t0 = Infinity;
          break;
        }
        continue;
      }
      const a = (lo - p) / d;
      const b = (hi - p) / d;
      t0 = Math.max(t0, Math.min(a, b));
      t1 = Math.min(t1, Math.max(a, b));
      if (t0 > t1) {
        t0 = Infinity;
        break;
      }
    }
    nearest = Math.min(nearest, t0);
  }
  return nearest;
}

/** Height of the rider's eyes: the line out to the camera starts here. */
const EYE = 1.3;
/**
 * With a tree's crown in the way, the camera rises over it (coming in a
 * little as it goes): extra height, and share of the usual distance.
 */
const RISE_OVER: [number, number][] = [
  [0, 1],
  [2.5, 0.92],
  [5, 0.82],
  [8, 0.7],
];

/**
 * Where (0..1) the line from the car (at eye height) by (dx, dy, dz) first
 * enters a shade tree's crown, or Infinity if it doesn't.
 */
function firstCrown(px: number, pz: number, dx: number, dy: number, dz: number) {
  let nearest = Infinity;
  const reach = Math.hypot(dx, dz) + 4;
  const a = dx * dx + dy * dy + dz * dz;
  for (const tree of SHADE_TREES) {
    const fx = px - tree.at[0];
    const fz = pz - tree.at[1];
    if (Math.abs(fx) > reach || Math.abs(fz) > reach) continue;
    const { y, radius } = crownOf(tree);
    // (The crown is an icosahedron inside this sphere, so a small margin does.)
    const r = radius + 0.25;
    const fy = EYE - y;
    const c = fx * fx + fy * fy + fz * fz - r * r;
    if (c < 0) continue; // under this very crown: nowhere better to go
    const b = 2 * (fx * dx + fy * dy + fz * dz);
    const disc = b * b - 4 * a * c;
    if (disc < 0) continue;
    const t = (-b - Math.sqrt(disc)) / (2 * a);
    if (t >= 0 && t <= 1) nearest = Math.min(nearest, t);
  }
  return nearest;
}

/**
 * A chase camera that sits behind the car and turns with it. When the car
 * parks at a destination it swings round to frame that building. Before
 * `ready` (intro overlay still up) it holds an aerial view of the square.
 */
export default function CameraRig({ ready }: { ready: boolean }) {
  const gl = useThree((s) => s.gl);

  const rig = useRef({
    zoom: 1,
    yaw: car.heading,
    shift: 0,
    sheet: 0,
    look: new THREE.Vector3(0, 0, -10),
    desired: new THREE.Vector3(),
    lookTarget: new THREE.Vector3(),
  });

  useEffect(() => {
    const el = gl.domElement;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomBy(Math.exp(e.deltaY * 0.0012));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [gl]);

  useFrame(({ camera, size }, rawDelta) => {
    const dt = Math.min(rawDelta, 1 / 30);
    const r = rig.current;

    if (!ready) {
      r.desired.set(58, 62, 92);
      r.lookTarget.set(6, 0, 6);
      camera.position.copy(r.desired);
      r.look.copy(r.lookTarget);
      camera.lookAt(r.look);
      return;
    }

    const portrait = size.width / size.height < 0.8;
    r.zoom = THREE.MathUtils.damp(r.zoom, view.zoom, 5, dt);
    const zoom = r.zoom * (portrait ? 1.3 : 1);

    const { active, dismissed, vehicle } = cityStore.get();
    const parked = active !== null && Math.abs(car.speed) < 0.6;
    const panelOpen = active !== null && active !== dismissed;
    // Closer in behind the smaller rides (bikes), so they don't look tiny.
    const chase = vehicleById[vehicle].chase ?? 1;

    // Behind the car by default; parked, look from the car towards the building.
    let yaw = car.heading;
    let distance = (14 + Math.abs(car.speed) * 0.25) * zoom * chase;
    let height = 6.8 * zoom * chase;
    // (Aiming nearer and lower behind a bike keeps it clear of the destination bar.)
    let aheadDistance = 9 * chase;
    let aheadHeight = 2.6 * chase;
    if (parked && active) {
      const d = destinationById[active];
      const dx = d.center[0] - car.x;
      const dz = d.center[1] - car.z;
      const span = Math.hypot(dx, dz);
      yaw = Math.atan2(dx, dz);
      distance = (d.frame?.distance ?? Math.min(11 + span * 0.6, 13)) * zoom;
      height = (d.frame?.height ?? 4 + d.signHeight * 0.25) * zoom;
      // Aim most of the way to the building, a third of the way up it.
      aheadDistance = span * 0.7;
      aheadHeight = d.frame?.look ?? d.signHeight * 0.3;
    }
    r.yaw += wrapAngle(yaw - r.yaw) * (1 - Math.exp(-dt * (parked ? 1.6 : 3.2)));

    // Make room for the panel: slide sideways on desktop; on phones aim lower
    // so the landmark sits in the top half, above the bottom sheet.
    r.shift = THREE.MathUtils.damp(r.shift, panelOpen && !portrait ? 1 : 0, 3, dt);
    r.sheet = THREE.MathUtils.damp(r.sheet, panelOpen && portrait ? 1 : 0, 3, dt);

    const fx = Math.sin(r.yaw);
    const fz = Math.cos(r.yaw);
    // Screen-right, looking along (fx, fz).
    const rx = -fz;
    const rz = fx;
    const side = r.shift * distance * 0.38;

    const bx = -fx * distance + rx * side;
    const bz = -fz * distance + rz * side;
    // Rise over a tree's crown that's in the way rather than sit in it.
    let cx = car.x + bx;
    let cz = car.z + bz;
    let cy = height + 1;
    let crown = Infinity;
    let risen = 0;
    for (const [rise, k] of RISE_OVER) {
      crown = firstCrown(car.x, car.z, bx * k, height + 1 + rise - EYE, bz * k);
      cx = car.x + bx * k;
      cz = car.z + bz * k;
      cy = height + 1 + rise;
      risen = rise;
      if (crown > 1) break;
    }

    // Look ahead of the car; from higher up, aim nearer it so it stays in view.
    const ahead = aheadDistance * Math.max(0.25, 1 - risen / 10);
    const tx = car.x + fx * ahead + rx * side;
    const tz = car.z + fz * ahead + rz * side;
    r.lookTarget.set(tx, aheadHeight * (1 - r.sheet), tz);
    // Pull in rather than end up inside a house (or, if even the highest view
    // is blocked, a crown).
    const house = firstHit(car.x, car.z, cx - car.x, cz - car.z, cy - 1);
    const hit = Math.min(house, crown);
    if (hit < 1) {
      const t = Math.max(hit - 0.08, crown < house ? 0.4 : 0.25);
      cx = car.x + (cx - car.x) * t;
      cz = car.z + (cz - car.z) * t;
    }
    r.desired.set(cx, cy, cz);

    dampVector(camera.position, r.desired, house < 1 ? 8 : 4.5, dt);
    dampVector(r.look, r.lookTarget, 5, dt);
    camera.lookAt(r.look);
  });

  return null;
}
