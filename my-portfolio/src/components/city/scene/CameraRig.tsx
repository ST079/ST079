"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { car, cityStore, view, zoomBy } from "../store";

function dampVector(v: THREE.Vector3, target: THREE.Vector3, lambda: number, dt: number) {
  v.x = THREE.MathUtils.damp(v.x, target.x, lambda, dt);
  v.y = THREE.MathUtils.damp(v.y, target.y, lambda, dt);
  v.z = THREE.MathUtils.damp(v.z, target.z, lambda, dt);
}

/**
 * Follows the car from above and slightly behind-right, like a diorama.
 * Before `ready` (intro still showing) it hangs over the whole town, then
 * glides down. It looks a little ahead of the car, and shifts so an open
 * panel doesn't cover the car.
 */
export default function CameraRig({ ready }: { ready: boolean }) {
  const gl = useThree((s) => s.gl);

  const rig = useRef({
    zoom: 1,
    look: new THREE.Vector3(0, 0, 0),
    lead: new THREE.Vector2(),
    shift: new THREE.Vector2(),
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
    const portrait = size.width / size.height < 0.8;
    r.zoom = THREE.MathUtils.damp(r.zoom, view.zoom, 5, dt);
    const z = r.zoom * (portrait ? 1.3 : 1);

    const lead = THREE.MathUtils.clamp(car.speed * 0.3, -2, 5);
    r.lead.x = THREE.MathUtils.damp(r.lead.x, Math.sin(car.heading) * lead, 2.5, dt);
    r.lead.y = THREE.MathUtils.damp(r.lead.y, Math.cos(car.heading) * lead, 2.5, dt);

    // Keep the car clear of the panel: right side on desktop, bottom sheet on phones.
    const { active, dismissed } = cityStore.get();
    const panelOpen = active !== null && active !== dismissed;
    r.shift.x = THREE.MathUtils.damp(r.shift.x, panelOpen && !portrait ? 7 * z : 0, 3, dt);
    r.shift.y = THREE.MathUtils.damp(r.shift.y, panelOpen && portrait ? 17 * z : 0, 3, dt);

    if (ready) {
      const tx = car.x + r.lead.x + r.shift.x;
      const tz = car.z + r.lead.y + r.shift.y;
      r.desired.set(tx + 10 * z, 36 * z, tz + 38 * z);
      r.lookTarget.set(tx, 0, tz);
    } else {
      r.desired.set(40, 80, 95);
      r.lookTarget.set(0, 0, 0);
    }

    const ease = ready ? 2.4 : 30;
    dampVector(camera.position, r.desired, ease, dt);
    dampVector(r.look, r.lookTarget, ease * 1.4, dt);
    camera.lookAt(r.look);
  });

  return null;
}
