"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import {
  destinationById,
  destinations,
  DRIVABLE,
  LANE_OFFSET,
  planRoute,
  solids,
  type DestinationId,
  type Vec2,
} from "../layout";
import { car, cityStore, takeDriveRequest, useCity } from "../store";
import { mat } from "./parts";
import { vehicleById, type WheelSpec } from "./vehicles";

// Handling (wheelbase, top speed and size come from the vehicle)
const MAX_STEER = 0.55;
const MAX_REVERSE = 6;
const ACCEL = 13;
const BRAKE = 28;
const DRAG = 3.5;
// Autopilot
const AUTO_SPEED = 16;
const AUTO_DECEL = 12;
/** How far a two-wheeler leans into a turn, at most (radians). */
const MAX_LEAN = 0.5;

/** Parking within this distance of a spot (and slowly) opens its panel. */
const PARK_RADIUS = 4.2;
const LEAVE_RADIUS = 6.5;

const clamp = THREE.MathUtils.clamp;
const wrapAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
const approach = (value: number, target: number, step: number) =>
  value < target ? Math.min(value + step, target) : Math.max(value - step, target);

/** A polyline the autopilot follows, tracking how far along it the car is. */
class Route {
  readonly cum: number[] = [0];
  readonly length: number;
  s = 0;
  private segment = 0;

  constructor(
    readonly points: Vec2[],
    readonly destination: DestinationId | null,
  ) {
    for (let i = 1; i < points.length; i++) {
      const [a, b] = [points[i - 1], points[i]];
      this.cum.push(this.cum[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1]));
    }
    this.length = this.cum[this.cum.length - 1];
  }

  /** Move progress forward to the closest point on the next few segments. */
  update(x: number, z: number) {
    let best = this.s;
    let bestSegment = this.segment;
    let bestDistance = Infinity;
    const last = Math.min(this.segment + 3, this.points.length - 1);
    for (let i = this.segment; i < last; i++) {
      const [a, b] = [this.points[i], this.points[i + 1]];
      const abx = b[0] - a[0];
      const abz = b[1] - a[1];
      const lengthSq = abx * abx + abz * abz || 1;
      const t = clamp(((x - a[0]) * abx + (z - a[1]) * abz) / lengthSq, 0, 1);
      const d = Math.hypot(a[0] + abx * t - x, a[1] + abz * t - z);
      if (d < bestDistance) {
        bestDistance = d;
        best = this.cum[i] + t * Math.sqrt(lengthSq);
        bestSegment = i;
      }
    }
    if (best >= this.s) {
      this.s = best;
      this.segment = bestSegment;
    }
  }

  /**
   * The point `s` metres along the route, shifted to the left of the path.
   * Past the end it carries on along the last segment, so the steering target
   * never collapses onto the end point (which would make the car circle it).
   */
  pointAt(s: number, out: THREE.Vector2) {
    s = Math.max(s, 0);
    let i = 0;
    while (i < this.cum.length - 2 && this.cum[i + 1] < s) i++;
    const [a, b] = [this.points[i], this.points[i + 1]];
    const span = this.cum[i + 1] - this.cum[i] || 1;
    const t = (s - this.cum[i]) / span;
    const dx = (b[0] - a[0]) / span;
    const dz = (b[1] - a[1]) / span;
    // Left of the direction of travel is (dz, -dx).
    return out.set(a[0] + (b[0] - a[0]) * t + dz * LANE_OFFSET, a[1] + (b[1] - a[1]) * t - dx * LANE_OFFSET);
  }
}

/** Pressed keys by `KeyboardEvent.code`, ignoring typing in form fields. */
function useKeys() {
  const keys = useRef(new Set<string>());

  useEffect(() => {
    const pressed = keys.current;
    const down = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      pressed.add(e.code);
      // Space brakes; don't let it scroll or press a focused button.
      if (e.code === "Space") e.preventDefault();
    };
    const up = (e: KeyboardEvent) => pressed.delete(e.code);
    const clear = () => pressed.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
    };
  }, []);

  return keys;
}

/** Push the car (of the given radius) out of houses and temples, and back onto the paving. */
function collide(radius: number) {
  let hit = false;
  for (const { center, size } of solids) {
    const hx = size[0] / 2;
    const hz = size[1] / 2;
    const cx = clamp(car.x, center[0] - hx, center[0] + hx);
    const cz = clamp(car.z, center[1] - hz, center[1] + hz);
    const dx = car.x - cx;
    const dz = car.z - cz;
    const d = Math.hypot(dx, dz);
    if (d >= radius) continue;
    hit = true;
    if (d > 1e-4) {
      car.x = cx + (dx / d) * radius;
      car.z = cz + (dz / d) * radius;
    } else {
      // Centre inside the box: leave by the nearest side.
      const ox = hx - Math.abs(car.x - center[0]);
      const oz = hz - Math.abs(car.z - center[1]);
      if (ox < oz) car.x = center[0] + Math.sign(car.x - center[0] || 1) * (hx + radius);
      else car.z = center[1] + Math.sign(car.z - center[1] || 1) * (hz + radius);
    }
  }
  // Stay in the drivable areas: if outside all of them, come back to the
  // nearest point of the nearest one.
  let nearest: [number, number] | null = null;
  let nearestDistance = Infinity;
  for (const [x0, x1, z0, z1] of DRIVABLE) {
    const x = clamp(car.x, x0, x1);
    const z = clamp(car.z, z0, z1);
    const d = Math.hypot(car.x - x, car.z - z);
    if (d === 0) {
      nearest = null;
      break;
    }
    if (d < nearestDistance) {
      nearestDistance = d;
      nearest = [x, z];
    }
  }
  if (nearest) {
    hit = true;
    [car.x, car.z] = nearest;
  }
  return hit;
}

function nearestDestination() {
  let best: DestinationId | null = null;
  let bestDistance = Infinity;
  for (const d of destinations) {
    const distance = Math.hypot(car.x - d.spot[0], car.z - d.spot[1]);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = d.id;
    }
  }
  return { id: best, distance: bestDistance };
}

/** A tyre on its spinner: solid for cars and the motorbike, spoked for the bicycle. */
function Wheel({ spec }: { spec: WheelSpec }) {
  const width = spec.width ?? 0.28;
  const side = spec.x >= 0 ? 1 : -1;
  if (spec.spoked) {
    return (
      <>
        <mesh rotation-y={Math.PI / 2} material={mat("#22252b", 0.9)} castShadow>
          <torusGeometry args={[spec.radius - 0.03, 0.035, 8, 28]} />
        </mesh>
        <mesh rotation-z={Math.PI / 2} material={mat("#d7dce2", 0.5)}>
          <cylinderGeometry args={[0.05, 0.05, 0.1, 10]} />
        </mesh>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <mesh key={i} rotation-x={(i * Math.PI) / 6} material={mat("#c4cad2", 0.5)}>
            <boxGeometry args={[0.012, (spec.radius - 0.05) * 2, 0.012]} />
          </mesh>
        ))}
      </>
    );
  }
  return (
    <>
      <mesh rotation-z={Math.PI / 2} material={mat("#22252b", 0.9)} castShadow>
        <cylinderGeometry args={[spec.radius, spec.radius, width, 18]} />
      </mesh>
      <mesh position-x={side * (width / 2 + 0.005)} rotation-z={Math.PI / 2} material={mat("#d7dce2", 0.5)}>
        <cylinderGeometry args={[spec.radius * 0.52, spec.radius * 0.52, 0.02, 14]} />
      </mesh>
      <mesh position-x={side * (width / 2 + 0.02)} material={mat("#8d96a3", 0.5)}>
        <boxGeometry args={[0.02, spec.radius * 0.9, 0.07]} />
      </mesh>
    </>
  );
}

/**
 * The visitor's car (or bike). Arrow keys / WASD drive it; Space brakes.
 * Destinations (from the HUD, signs, buildings or clicking the paving) are
 * driven to by an autopilot that follows the paths around the temples,
 * keeping left. Two-wheelers lean into their turns.
 */
export default function Car() {
  const vehicle = vehicleById[useCity((s) => s.vehicle)];
  const root = useRef<THREE.Group>(null!);
  const lean = useRef<THREE.Group>(null!);
  const body = useRef<THREE.Group>(null!);
  const wheels = useRef<(THREE.Group | null)[]>([]);
  const pivots = useRef<(THREE.Group | null)[]>([]);

  const keys = useKeys();
  const route = useRef<Route | null>(null);
  const scratch = useRef({
    target: new THREE.Vector2(),
    stuck: 0,
    reversing: false,
    reverseSide: 1,
  });

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 1 / 30);
    const k = keys.current;
    const s = scratch.current;
    const { wheelbase, maxSpeed, radius } = vehicle;

    // 1. Pick up a new destination from the HUD, a sign or a click.
    const request = takeDriveRequest();
    if (request === "stop") {
      route.current = null;
      cityStore.set({ driving: null });
    } else if (request) {
      route.current = new Route(planRoute([car.x, car.z], request.target), request.destination);
      s.stuck = 0;
      s.reversing = false;
      cityStore.set({ driving: request.destination ?? "point", active: null, dismissed: null });
    }

    // 2. Keyboard input. Any input takes the wheel back from the autopilot.
    const throttle = (k.has("KeyW") || k.has("ArrowUp") ? 1 : 0) - (k.has("KeyS") || k.has("ArrowDown") ? 1 : 0);
    const steerInput = (k.has("KeyA") || k.has("ArrowLeft") ? 1 : 0) - (k.has("KeyD") || k.has("ArrowRight") ? 1 : 0);
    const braking = k.has("Space");
    const manual = throttle !== 0 || steerInput !== 0 || braking;

    if (manual && route.current) {
      route.current = null;
      cityStore.set({ driving: null });
    }
    if (manual && !cityStore.get().started) cityStore.set({ started: true });

    let targetSteer = 0;
    const r = route.current;

    if (r) {
      // 3a. Autopilot: pure-pursuit steering towards a point ahead on the route.
      r.update(car.x, car.z);
      const remaining = r.length - r.s;
      car.remaining = remaining;

      const lookahead = clamp(3.5 + Math.abs(car.speed) * 0.35, 3.5, 8);
      const target = r.pointAt(r.s + lookahead, s.target);
      const dx = target.x - car.x;
      const dz = target.y - car.z;
      const alpha = wrapAngle(Math.atan2(dx, dz) - car.heading);

      // If the route starts behind us, back out like leaving a parking spot:
      // reverse at opposite lock until we roughly face it, then drive on.
      if (s.reversing) {
        if (Math.abs(alpha) < 0.9) s.reversing = false;
      } else if (Math.abs(alpha) > 2 && Math.abs(car.speed) < 4) {
        s.reversing = true;
        // Turn the nose towards the target. Dead behind, swing the tail to
        // our right (we keep left, so that's where the room is).
        s.reverseSide = Math.abs(alpha) > 2.8 ? 1 : Math.sign(alpha);
      }

      let wanted: number;
      if (s.reversing) {
        targetSteer = -s.reverseSide * MAX_STEER;
        wanted = -3.5;
      } else {
        targetSteer =
          Math.abs(alpha) > Math.PI / 2
            ? Math.sign(alpha) * MAX_STEER
            : clamp(Math.atan2(2 * wheelbase * Math.sin(alpha), Math.max(Math.hypot(dx, dz), 0.1)), -MAX_STEER, MAX_STEER);
        wanted = Math.min(AUTO_SPEED, maxSpeed, Math.sqrt(2 * AUTO_DECEL * Math.max(remaining - 0.4, 0)));
        wanted *= clamp(1 - Math.abs(alpha) / 1.4, 0.3, 1);
      }
      const speedingUp = Math.abs(wanted) > Math.abs(car.speed) && wanted * car.speed >= 0;
      car.speed = approach(car.speed, wanted, (speedingUp ? ACCEL : BRAKE) * dt);

      // Arrived, or wedged against something for a while: hand back control.
      s.stuck = Math.abs(car.speed) < 0.4 && remaining > 1.5 ? s.stuck + dt : 0;
      if ((remaining < 0.8 && Math.abs(car.speed) < 1.5) || s.stuck > 2.5) {
        route.current = null;
        car.speed = 0;
        const arrived = s.stuck <= 2.5 ? r.destination : null;
        cityStore.set({ driving: null, active: arrived, dismissed: null });
      }
    } else {
      // 3b. Manual driving.
      const maxSteer = MAX_STEER * (1 - 0.45 * Math.min(Math.abs(car.speed) / maxSpeed, 1));
      targetSteer = steerInput * maxSteer;
      if (throttle > 0) car.speed += (car.speed < 0 ? BRAKE : ACCEL) * dt;
      else if (throttle < 0) car.speed -= (car.speed > 0 ? BRAKE : ACCEL * 0.6) * dt;
      else car.speed = approach(car.speed, 0, DRAG * dt);
      if (braking) car.speed = approach(car.speed, 0, BRAKE * 1.2 * dt);
      car.speed = clamp(car.speed, -MAX_REVERSE, maxSpeed);

      // Parking near a destination opens its panel; driving away closes it.
      const near = nearestDestination();
      const { active } = cityStore.get();
      if (near.id && near.distance < PARK_RADIUS && Math.abs(car.speed) < 3 && active !== near.id) {
        cityStore.set({ active: near.id, dismissed: null });
      } else if (active) {
        const spot = destinationById[active].spot;
        if (Math.hypot(car.x - spot[0], car.z - spot[1]) > LEAVE_RADIUS) {
          cityStore.set({ active: null, dismissed: null });
        }
      }
    }

    // 4. Move (bicycle model) and resolve collisions.
    car.steer = THREE.MathUtils.damp(car.steer, targetSteer, 10, dt);
    car.heading += (car.speed / wheelbase) * Math.tan(car.steer) * dt;
    car.x += Math.sin(car.heading) * car.speed * dt;
    car.z += Math.cos(car.heading) * car.speed * dt;
    if (collide(radius)) car.speed *= 1 - Math.min(1, 5 * dt);

    // 5. Visuals: position, wheel spin, steering, and a little body roll (or,
    // on two wheels, a proper lean into the turn).
    root.current.position.set(car.x, 0, car.z);
    root.current.rotation.y = car.heading;
    car.travelled += car.speed * dt;
    wheels.current.forEach((wheel) => {
      if (wheel) wheel.rotation.x = car.travelled / (wheel.userData.radius as number);
    });
    pivots.current.forEach((pivot) => {
      if (pivot) pivot.rotation.y = car.steer;
    });
    const roll = -car.steer * car.speed;
    if (vehicle.twoWheeler) {
      lean.current.rotation.z = THREE.MathUtils.damp(lean.current.rotation.z, clamp(roll * 0.06, -MAX_LEAN, MAX_LEAN), 6, dt);
      body.current.rotation.z = 0;
    } else {
      lean.current.rotation.z = 0;
      body.current.rotation.z = THREE.MathUtils.damp(body.current.rotation.z, roll * 0.01, 6, dt);
    }
  });

  const { Body, Fork } = vehicle;

  return (
    <group ref={root} position={[car.x, 0, car.z]} rotation-y={car.heading}>
      <group ref={lean}>
        <group ref={body}>
          <Body />
        </group>

        {/* Each wheel: steering pivot (front only, carrying a bike's fork) > spinner (turns about the axle) > tyre */}
        {vehicle.wheels.map((w, i) => (
          <group key={`${vehicle.id}-${i}`} position={[w.x, w.radius, w.z]}>
            <group
              ref={(el) => {
                pivots.current[i] = w.front ? el : null;
              }}
            >
              {w.front && Fork && <Fork />}
              <group
                ref={(el) => {
                  wheels.current[i] = el;
                }}
                userData={{ radius: w.radius }}
              >
                <Wheel spec={w} />
              </group>
            </group>
          </group>
        ))}
      </group>
    </group>
  );
}
