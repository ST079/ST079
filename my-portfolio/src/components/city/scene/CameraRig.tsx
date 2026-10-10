"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { destinationById, solids } from "../layout";
import { car, cityStore, view, zoomBy } from "../store";

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
      r.desired.set(46, 52, 74);
      r.lookTarget.set(4, 0, 4);
      camera.position.copy(r.desired);
      r.look.copy(r.lookTarget);
      camera.lookAt(r.look);
      return;
    }

    const portrait = size.width / size.height < 0.8;
    r.zoom = THREE.MathUtils.damp(r.zoom, view.zoom, 5, dt);
    const zoom = r.zoom * (portrait ? 1.3 : 1);

    const { active, dismissed } = cityStore.get();
    const parked = active !== null && Math.abs(car.speed) < 0.6;
    const panelOpen = active !== null && active !== dismissed;

    // Behind the car by default; parked, look from the car towards the building.
    let yaw = car.heading;
    let distance = (14 + Math.abs(car.speed) * 0.25) * zoom;
    let height = 6.8 * zoom;
    let aheadDistance = 9;
    let aheadHeight = 2.6;
    if (parked && active) {
      const d = destinationById[active];
      const dx = d.center[0] - car.x;
      const dz = d.center[1] - car.z;
      const span = Math.hypot(dx, dz);
      yaw = Math.atan2(dx, dz);
      distance = (11 + span * 0.6) * zoom;
      height = (4 + d.signHeight * 0.25) * zoom;
      aheadDistance = span * 0.45;
      aheadHeight = d.signHeight * 0.2;
    }
    r.yaw += wrapAngle(yaw - r.yaw) * (1 - Math.exp(-dt * (parked ? 1.6 : 3.2)));

    // Make room for the panel: slide sideways on desktop, tilt up on phones.
    r.shift = THREE.MathUtils.damp(r.shift, panelOpen && !portrait ? 1 : 0, 3, dt);
    r.sheet = THREE.MathUtils.damp(r.sheet, panelOpen && portrait ? 1 : 0, 3, dt);

    const fx = Math.sin(r.yaw);
    const fz = Math.cos(r.yaw);
    // Screen-right, looking along (fx, fz).
    const rx = -fz;
    const rz = fx;
    const side = r.shift * distance * 0.38;
    const back = r.sheet * distance * 0.4;

    const tx = car.x + fx * (aheadDistance - back) + rx * side;
    const tz = car.z + fz * (aheadDistance - back) + rz * side;
    r.lookTarget.set(tx, aheadHeight, tz);

    let cx = car.x - fx * distance + rx * side;
    let cz = car.z - fz * distance + rz * side;
    // Pull in rather than end up inside a house.
    const hit = firstHit(car.x, car.z, cx - car.x, cz - car.z, height);
    if (hit < 1) {
      const t = Math.max(hit - 0.08, 0.25);
      cx = car.x + (cx - car.x) * t;
      cz = car.z + (cz - car.z) * t;
    }
    r.desired.set(cx, height + 1, cz);

    dampVector(camera.position, r.desired, hit < 1 ? 8 : 3.5, dt);
    dampVector(r.look, r.lookTarget, 5, dt);
    camera.lookAt(r.look);
  });

  return null;
}
