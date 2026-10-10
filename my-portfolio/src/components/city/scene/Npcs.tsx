"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { HILL, isOpen, LANDMARKS, PAVED, seeded, solids, type Vec2 } from "../layout";
import { car } from "../store";

// Life in the squares: tourists wandering between temples (and a few sitting
// on Nyatapola's steps), street dogs, cats, Swayambhunath's monkeys and flocks
// of pigeons. Everyone gets out of the way of the car.
//
// Each kind is a small "rig" of parts. Every part is one InstancedMesh shared
// by all characters of that kind, posed per frame, so the whole crowd costs a
// couple of dozen draw calls.

type Kind = "tourist" | "dog" | "cat";
type Mode = "walk" | "pause" | "flee" | "sit";

interface Agent {
  kind: Kind;
  x: number;
  y: number;
  z: number;
  yaw: number;
  speed: number;
  mode: Mode;
  timer: number;
  /** Walk-cycle phase. */
  phase: number;
  /** Seconds without progress while walking (to give up on blocked targets). */
  blocked: number;
  target: Vec2;
  /** Paved area this character wanders in (index into PAVED). */
  region: number;
  scale: number;
  /** Seated for good (tourists on the temple steps). */
  fixed: boolean;
  /** Raises a camera while pausing at a temple. */
  photographer: boolean;
  hat: 0 | 1 | 2;
  backpack: boolean;
  colors: string[];
}

const SKIN = ["#f1c27d", "#e0ac69", "#c68642", "#8d5524", "#ffdbac", "#d9a066"];
const SHIRTS = ["#e76f51", "#2a9d8f", "#264653", "#f4a261", "#8ab17d", "#e9c46a", "#6d597a", "#457b9d", "#f1faee", "#d62828"];
const PANTS = ["#2b2d42", "#3d405b", "#8d7b68", "#1d3557", "#5c4d3c"];
const HATS = ["#f2e8cf", "#e9d8a6", "#ffffff", "#264653", "#bc4749"];
const PACKS = ["#2a9d8f", "#e76f51", "#3d405b", "#8ab17d", "#f4a261"];
const DOG_FUR = [
  ["#c49a6c", "#8b6a45"],
  ["#2b2b2b", "#1a1a1a"],
  ["#e8e2d6", "#c9bfae"],
  ["#8b5a2b", "#5c3a1a"],
  ["#d9b98c", "#a67c52"],
];
// Rhesus macaques: Swayambhunath's monkeys use the cat's rig, in their colours.
const MONKEY_FUR = [
  ["#8b7355", "#5e4b38"],
  ["#9a8366", "#6b5844"],
  ["#7d6a58", "#55463a"],
];
const CAT_FUR = [
  ["#e08a3c", "#b8682a"],
  ["#8a8a8a", "#666666"],
  ["#222222", "#111111"],
  ["#eeeeee", "#cfcfcf"],
];

const RADIUS: Record<Kind, number> = { tourist: 0.35, dog: 0.45, cat: 0.25 };
const WALK: Record<Kind, number> = { tourist: 1.25, dog: 1.5, cat: 1.1 };
const RUN: Record<Kind, number> = { tourist: 3.4, dog: 5, cat: 5.5 };

const landmarkCenters = Object.values(LANDMARKS).map((l) => l.center as Vec2);

function randomOpenPoint(rand: () => number, region: number, near?: Vec2, radius = 14): Vec2 {
  const [x0, x1, z0, z1] = PAVED[region];
  for (let i = 0; i < 40; i++) {
    const x = near ? near[0] + (rand() * 2 - 1) * radius : x0 + rand() * (x1 - x0);
    const z = near ? near[1] + (rand() * 2 - 1) * radius : z0 + rand() * (z1 - z0);
    if (isOpen(x, z, 1.2)) return [x, z];
  }
  return near ?? [(x0 + x1) / 2, (z0 + z1) / 2];
}

function createAgents() {
  const rand = seeded(2024);
  const pick = <T,>(list: readonly T[]) => list[Math.floor(rand() * list.length)];
  const agents: Agent[] = [];

  const add = (kind: Kind, region: number, at?: Vec2, extra: Partial<Agent> = {}) => {
    const [x, z] = at ?? randomOpenPoint(rand, region);
    const agent: Agent = {
      kind,
      x,
      y: 0,
      z,
      yaw: rand() * Math.PI * 2,
      speed: 0,
      mode: "pause",
      timer: rand() * 4,
      phase: rand() * Math.PI * 2,
      blocked: 0,
      target: [x, z],
      region,
      scale: kind === "tourist" ? 0.92 + rand() * 0.16 : 0.85 + rand() * 0.3,
      fixed: false,
      photographer: rand() < 0.45,
      hat: (rand() < 0.4 ? 1 : rand() < 0.3 ? 2 : 0) as 0 | 1 | 2,
      backpack: rand() < 0.5,
      colors:
        kind === "tourist"
          ? [pick(SKIN), pick(SHIRTS), pick(PANTS), pick(HATS), pick(PACKS)]
          : [...pick(kind === "dog" ? DOG_FUR : CAT_FUR)],
      ...extra,
    };
    agents.push(agent);
  };

  // Tourists wandering Durbar Square and Taumadhi
  for (let i = 0; i < 11; i++) add("tourist", 0);
  for (let i = 0; i < 4; i++) add("tourist", 1);
  // ...and a few resting on Nyatapola's steps, facing the square (west).
  const [nx, nz] = LANDMARKS.nyatapola.center;
  const seats: [number, number, number][] = [
    [nx - 6.15, nz - 3.1, 1.15],
    [nx - 6.15, nz + 3.3, 1.15],
    [nx - 5.35, nz + 2.7, 2.3],
    [nx - 4.55, nz - 2.5, 3.45],
  ];
  for (const [x, z, seat] of seats) {
    add("tourist", 1, [x, z], { fixed: true, mode: "sit", y: seat - 0.82, yaw: -Math.PI / 2, photographer: false });
  }

  // Street dogs
  add("dog", 0, [-20, 9]);
  add("dog", 0, [20, 11]);
  add("dog", 0, [-36, -10]);
  add("dog", 1, [62, 70]);
  add("dog", 2, [-14, 32]);

  // Cats near the temples
  add("cat", 0, [3.6, -1.5]);
  add("cat", 0, [-7, 11]);
  add("cat", 1, [44, 66]);
  add("cat", 2, [-22, 50.5]);

  // Swayambhunath: visitors walking round the hill, and its monkeys (region 4)
  const [hx, hz] = HILL.center;
  for (let i = 0; i < 7; i++) add("tourist", 4);
  const monkeys: Vec2[] = [
    [hx + 33, hz + 8],
    [hx + 30, hz - 13],
    [hx - 20, hz + 31],
    [hx - 33, hz - 6],
    [hx + 9, hz - 31],
    [hx + 22, hz + 31],
  ];
  for (const at of monkeys) add("cat", 4, at, { colors: [...pick(MONKEY_FUR)], scale: 1.35 + rand() * 0.2 });
  // ...a few sat on the stairway, watching the road (steps rise 0.5 every 0.53)
  for (const [step, z] of [[4, -0.9], [9, 1], [15, -0.6]]) {
    add("cat", 4, [hx + 26 - (step + 0.5) * 0.533, hz + z], {
      fixed: true,
      mode: "sit",
      y: (step + 1) * 0.5075,
      yaw: Math.PI / 2,
      colors: [...pick(MONKEY_FUR)],
      scale: 1.4,
    });
  }

  return agents;
}

// ---------------------------------------------------------------------------
// Behaviour
// ---------------------------------------------------------------------------

const wrapAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

function nearestLandmark(x: number, z: number) {
  let best = landmarkCenters[0];
  let bestD = Infinity;
  for (const c of landmarkCenters) {
    const d = Math.hypot(c[0] - x, c[1] - z);
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best;
}

function pushOut(a: Agent) {
  const r = RADIUS[a.kind] * a.scale;
  for (const s of solids) {
    const hx = s.size[0] / 2;
    const hz = s.size[1] / 2;
    const cx = THREE.MathUtils.clamp(a.x, s.center[0] - hx, s.center[0] + hx);
    const cz = THREE.MathUtils.clamp(a.z, s.center[1] - hz, s.center[1] + hz);
    const dx = a.x - cx;
    const dz = a.z - cz;
    const d = Math.hypot(dx, dz);
    if (d < r && d > 1e-4) {
      a.x = cx + (dx / d) * r;
      a.z = cz + (dz / d) * r;
    }
  }
  // Never end up under the car.
  const dx = a.x - car.x;
  const dz = a.z - car.z;
  const d = Math.hypot(dx, dz);
  const min = 1.9 + r;
  if (d < min && d > 1e-4) {
    a.x = car.x + (dx / d) * min;
    a.z = car.z + (dz / d) * min;
  }
}

function step(a: Agent, dt: number, rand: () => number) {
  if (a.fixed) return;

  // Get out of the car's way.
  const dxCar = a.x - car.x;
  const dzCar = a.z - car.z;
  const dCar = Math.hypot(dxCar, dzCar);
  const ahead = Math.sin(car.heading) * -dxCar + Math.cos(car.heading) * -dzCar < 0; // car moving towards us
  if (dCar < 6.5 && Math.abs(car.speed) > 0.8 && (ahead || dCar < 3.5) && a.mode !== "flee") {
    const away = Math.atan2(dxCar, dzCar) + (rand() - 0.5) * 1.2;
    const [tx, tz] = [a.x + Math.sin(away) * 7, a.z + Math.cos(away) * 7];
    a.target = isOpen(tx, tz, 0.8) ? [tx, tz] : randomOpenPoint(rand, a.region, [a.x, a.z], 9);
    a.mode = "flee";
    a.timer = 2.5;
  }

  if (a.mode === "walk" || a.mode === "flee") {
    const dx = a.target[0] - a.x;
    const dz = a.target[1] - a.z;
    const d = Math.hypot(dx, dz);
    const wanted = a.mode === "flee" ? RUN[a.kind] : WALK[a.kind];
    a.speed = THREE.MathUtils.damp(a.speed, d < 0.4 ? 0 : wanted, 6, dt);
    a.yaw += wrapAngle(Math.atan2(dx, dz) - a.yaw) * Math.min(1, dt * 6);
    const beforeX = a.x;
    const beforeZ = a.z;
    a.x += Math.sin(a.yaw) * a.speed * dt;
    a.z += Math.cos(a.yaw) * a.speed * dt;
    pushOut(a);
    const moved = Math.hypot(a.x - beforeX, a.z - beforeZ);
    a.blocked = moved < a.speed * dt * 0.3 ? a.blocked + dt : 0;

    a.timer -= dt;
    if (d < 0.45 || a.blocked > 1.2 || (a.mode === "flee" && a.timer <= 0)) {
      a.speed = 0;
      a.blocked = 0;
      a.mode = a.kind === "cat" ? "sit" : "pause";
      a.timer = a.kind === "tourist" ? 2 + rand() * 5 : a.kind === "dog" ? 3 + rand() * 9 : 5 + rand() * 10;
      if (a.kind === "tourist") {
        const [lx, lz] = nearestLandmark(a.x, a.z);
        a.target = [lx, lz];
      }
    }
  } else {
    a.speed = THREE.MathUtils.damp(a.speed, 0, 8, dt);
    pushOut(a);
    // Tourists turn to look at the nearest temple while they pause.
    if (a.kind === "tourist") {
      a.yaw += wrapAngle(Math.atan2(a.target[0] - a.x, a.target[1] - a.z) - a.yaw) * Math.min(1, dt * 3);
    }
    a.timer -= dt;
    if (a.timer <= 0) {
      a.mode = "walk";
      a.target = randomOpenPoint(rand, a.region, a.kind === "tourist" ? undefined : [a.x, a.z], a.kind === "cat" ? 6 : 12);
    }
  }
  a.phase += a.speed * dt * (a.kind === "tourist" ? 5.5 : 9);
}

// ---------------------------------------------------------------------------
// Rigs: parts posed per character
// ---------------------------------------------------------------------------

interface Pose {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
}

interface PartDef {
  geometry: THREE.BufferGeometry;
  /** Instances per character (e.g. 2 legs). */
  copies: number;
  /** Colour index into the character's palette, or a fixed colour. */
  color: number | string;
  shadow?: boolean;
  pose: (a: Agent, copy: number, t: number, out: Pose) => void;
}

/** A box whose origin is at its top centre: limbs rotate about the hip/shoulder. */
function limb(w: number, h: number, d: number) {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(0, -h / 2, 0);
  return g;
}

const hidden = (out: Pose) => out.scale.set(0, 0, 0);

function touristParts(): PartDef[] {
  const walking = (a: Agent) => Math.min(1, a.speed / 1.2);
  return [
    {
      geometry: limb(0.15, 0.86, 0.17),
      copies: 2,
      color: 2,
      shadow: true,
      pose: (a, c, _t, out) => {
        const side = c === 0 ? 1 : -1;
        const swing = a.mode === "sit" ? -1.15 : Math.sin(a.phase + c * Math.PI) * 0.55 * walking(a);
        out.position.set(side * 0.1, 0.88, 0);
        out.rotation.set(swing, 0, 0);
      },
    },
    {
      geometry: new THREE.BoxGeometry(0.42, 0.62, 0.24),
      copies: 1,
      color: 1,
      shadow: true,
      pose: (_a, _c, _t, out) => out.position.set(0, 1.19, 0),
    },
    {
      geometry: limb(0.11, 0.6, 0.12),
      copies: 2,
      color: 1,
      pose: (a, c, _t, out) => {
        const side = c === 0 ? 1 : -1;
        const camera = a.photographer && a.mode === "pause";
        const swing = camera ? -1.35 : a.mode === "sit" ? -0.35 : -Math.sin(a.phase + c * Math.PI) * 0.45 * walking(a);
        out.position.set(side * 0.27, 1.47, 0);
        out.rotation.set(swing, 0, camera ? -side * 0.35 : side * 0.06);
      },
    },
    {
      geometry: new THREE.SphereGeometry(0.15, 12, 10),
      copies: 1,
      color: 0,
      shadow: true,
      pose: (_a, _c, _t, out) => out.position.set(0, 1.66, 0),
    },
    {
      // Sun-hat brim or cap visor
      geometry: new THREE.CylinderGeometry(0.26, 0.26, 0.03, 16),
      copies: 1,
      color: 3,
      pose: (a, _c, _t, out) => {
        if (a.hat === 0) return hidden(out);
        if (a.hat === 1) out.position.set(0, 1.78, 0);
        else {
          out.position.set(0, 1.76, 0.12);
          out.scale.set(0.55, 1, 0.6);
        }
      },
    },
    {
      geometry: new THREE.CylinderGeometry(0.13, 0.15, 0.13, 14),
      copies: 1,
      color: 3,
      pose: (a, _c, _t, out) => {
        if (a.hat === 0) return hidden(out);
        out.position.set(0, 1.83, 0);
      },
    },
    {
      geometry: new THREE.BoxGeometry(0.32, 0.4, 0.16),
      copies: 1,
      color: 4,
      pose: (a, _c, _t, out) => {
        if (!a.backpack || a.mode === "sit") return hidden(out);
        out.position.set(0, 1.22, -0.2);
      },
    },
    {
      // The camera held up to the face
      geometry: new THREE.BoxGeometry(0.16, 0.1, 0.07),
      copies: 1,
      color: "#22252b",
      pose: (a, _c, _t, out) => {
        if (!(a.photographer && a.mode === "pause")) return hidden(out);
        out.position.set(0, 1.6, 0.3);
      },
    },
  ];
}

function dogParts(): PartDef[] {
  const lying = (a: Agent) => a.mode === "pause" && a.timer > 2.5;
  return [
    {
      geometry: new THREE.BoxGeometry(0.34, 0.3, 0.8),
      copies: 1,
      color: 0,
      shadow: true,
      pose: (a, _c, _t, out) => out.position.set(0, lying(a) ? 0.2 : 0.5, 0),
    },
    {
      geometry: new THREE.BoxGeometry(0.28, 0.26, 0.3),
      copies: 1,
      color: 0,
      shadow: true,
      pose: (a, _c, t, out) => {
        const down = lying(a);
        out.position.set(0, down ? 0.3 : 0.74, down ? 0.5 : 0.5);
        out.rotation.set(down ? 0.2 : Math.sin(t * 1.3 + a.phase) * 0.08, Math.sin(t * 0.7 + a.phase) * 0.25, 0);
      },
    },
    {
      geometry: new THREE.BoxGeometry(0.15, 0.13, 0.2),
      copies: 1,
      color: 1,
      pose: (a, _c, _t, out) => {
        const down = lying(a);
        out.position.set(0, down ? 0.25 : 0.68, down ? 0.72 : 0.74);
      },
    },
    {
      geometry: new THREE.BoxGeometry(0.07, 0.13, 0.05),
      copies: 2,
      color: 1,
      pose: (a, c, _t, out) => {
        const down = lying(a);
        out.position.set((c === 0 ? 1 : -1) * 0.1, down ? 0.46 : 0.91, 0.45);
        out.rotation.set(-0.2, 0, (c === 0 ? 1 : -1) * 0.25);
      },
    },
    {
      geometry: (() => {
        const g = new THREE.BoxGeometry(0.06, 0.06, 0.38);
        g.translate(0, 0, -0.19);
        return g;
      })(),
      copies: 1,
      color: 1,
      pose: (a, _c, t, out) => {
        const down = lying(a);
        out.position.set(0, down ? 0.26 : 0.58, -0.4);
        const wag = down ? 0 : Math.sin(t * (a.mode === "flee" ? 6 : 11) + a.phase) * 0.55;
        out.rotation.set(down ? 0 : 0.65, wag, 0);
      },
    },
    {
      geometry: limb(0.09, 0.36, 0.09),
      copies: 4,
      color: 0,
      pose: (a, c, _t, out) => {
        if (lying(a)) return hidden(out);
        const front = c < 2;
        const side = c % 2 === 0 ? 1 : -1;
        const swing = Math.sin(a.phase + (front === (side > 0) ? 0 : Math.PI)) * 0.6 * Math.min(1, a.speed / 1.4);
        out.position.set(side * 0.11, 0.38, front ? 0.28 : -0.28);
        out.rotation.set(swing, 0, 0);
      },
    },
  ];
}

function catParts(): PartDef[] {
  const sitting = (a: Agent) => a.mode === "sit" || a.mode === "pause";
  return [
    {
      geometry: new THREE.BoxGeometry(0.2, 0.18, 0.46),
      copies: 1,
      color: 0,
      shadow: true,
      pose: (a, _c, _t, out) => {
        if (sitting(a)) {
          out.position.set(0, 0.24, -0.05);
          out.rotation.set(-0.55, 0, 0);
        } else out.position.set(0, 0.26, 0);
      },
    },
    {
      geometry: new THREE.BoxGeometry(0.18, 0.16, 0.16),
      copies: 1,
      color: 0,
      shadow: true,
      pose: (a, _c, t, out) => {
        out.position.set(0, sitting(a) ? 0.45 : 0.36, sitting(a) ? 0.15 : 0.27);
        out.rotation.set(0, Math.sin(t * 0.5 + a.phase) * 0.35, 0);
      },
    },
    {
      geometry: new THREE.ConeGeometry(0.04, 0.08, 4),
      copies: 2,
      color: 1,
      pose: (a, c, _t, out) => {
        out.position.set((c === 0 ? 1 : -1) * 0.055, sitting(a) ? 0.56 : 0.47, sitting(a) ? 0.15 : 0.27);
      },
    },
    {
      geometry: (() => {
        const g = new THREE.BoxGeometry(0.04, 0.04, 0.34);
        g.translate(0, 0, -0.17);
        return g;
      })(),
      copies: 1,
      color: 1,
      pose: (a, _c, t, out) => {
        out.position.set(0, sitting(a) ? 0.1 : 0.3, sitting(a) ? -0.2 : -0.22);
        out.rotation.set(sitting(a) ? -0.1 : 0.9, Math.sin(t * 1.6 + a.phase) * (sitting(a) ? 0.6 : 0.3), 0);
      },
    },
    {
      geometry: limb(0.05, 0.2, 0.05),
      copies: 4,
      color: 0,
      pose: (a, c, _t, out) => {
        const front = c < 2;
        const side = c % 2 === 0 ? 1 : -1;
        if (sitting(a) && !front) return hidden(out);
        const swing = Math.sin(a.phase + (front === (side > 0) ? 0 : Math.PI)) * 0.7 * Math.min(1, a.speed / 1.2);
        out.position.set(side * 0.06, sitting(a) ? 0.3 : 0.2, front ? (sitting(a) ? 0.1 : 0.16) : -0.16);
        out.rotation.set(sitting(a) ? 0.15 : swing, 0, 0);
      },
    },
  ];
}

const RIGS: Record<Kind, () => PartDef[]> = { tourist: touristParts, dog: dogParts, cat: catParts };

/** One InstancedMesh per part, posed for every character of `kind`. */
function Crowd({ kind, agents }: { kind: Kind; agents: Agent[] }) {
  const parts = useMemo(() => RIGS[kind](), [kind]);
  const meshes = useRef<(THREE.InstancedMesh | null)[]>([]);
  const scratch = useMemo(
    () => ({
      root: new THREE.Object3D(),
      local: new THREE.Object3D(),
      matrix: new THREE.Matrix4(),
      pose: { position: new THREE.Vector3(), rotation: new THREE.Euler(0, 0, 0, "YXZ"), scale: new THREE.Vector3() } as Pose,
    }),
    [],
  );

  useLayoutEffect(() => {
    const color = new THREE.Color();
    parts.forEach((part, p) => {
      const mesh = meshes.current[p];
      if (!mesh) return;
      agents.forEach((a, i) => {
        const c = typeof part.color === "number" ? a.colors[part.color] : part.color;
        for (let k = 0; k < part.copies; k++) mesh.setColorAt(i * part.copies + k, color.set(c));
      });
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    });
  }, [parts, agents]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const { root, local, matrix, pose } = scratch;
    agents.forEach((a, i) => {
      const bob = a.kind === "tourist" ? Math.abs(Math.sin(a.phase)) * 0.04 * Math.min(1, a.speed) : 0;
      root.position.set(a.x, a.y + bob, a.z);
      root.rotation.set(0, a.yaw, 0);
      root.scale.setScalar(a.scale);
      root.updateMatrix();
      parts.forEach((part, p) => {
        const mesh = meshes.current[p];
        if (!mesh) return;
        for (let k = 0; k < part.copies; k++) {
          pose.position.set(0, 0, 0);
          pose.rotation.set(0, 0, 0);
          pose.scale.set(1, 1, 1);
          part.pose(a, k, t, pose);
          local.position.copy(pose.position);
          local.rotation.copy(pose.rotation);
          local.scale.copy(pose.scale);
          local.updateMatrix();
          matrix.multiplyMatrices(root.matrix, local.matrix);
          mesh.setMatrixAt(i * part.copies + k, matrix);
        }
      });
    });
    meshes.current.forEach((mesh) => {
      if (mesh) mesh.instanceMatrix.needsUpdate = true;
    });
  });

  return (
    <>
      {parts.map((part, p) => (
        <instancedMesh
          key={p}
          ref={(el) => {
            meshes.current[p] = el;
          }}
          args={[part.geometry, undefined, agents.length * part.copies]}
          castShadow={part.shadow ?? false}
          frustumCulled={false}
        >
          <meshStandardMaterial roughness={0.85} />
        </instancedMesh>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Pigeons
// ---------------------------------------------------------------------------

interface Pigeon {
  home: Vec2;
  x: number;
  y: number;
  z: number;
  yaw: number;
  angle: number;
  radius: number;
  phase: number;
}

const FLOCKS: { center: Vec2; count: number }[] = [
  { center: [-18, -3], count: 22 },
  { center: [40, 47], count: 14 },
  { center: [HILL.center[0] + 26, HILL.center[1] + 16], count: 14 }, // by Swayambhu's stairs
];

const BIRDS: Pigeon[] = (() => {
  const rand = seeded(77);
  return FLOCKS.flatMap((flock) =>
    Array.from({ length: flock.count }, (): Pigeon => {
      const a = rand() * Math.PI * 2;
      const r = Math.sqrt(rand()) * 3.2;
      const home: Vec2 = [flock.center[0] + Math.cos(a) * r, flock.center[1] + Math.sin(a) * r];
      return { home, x: home[0], y: 0, z: home[1], yaw: rand() * 6.28, angle: rand() * 6.28, radius: 5 + rand() * 6, phase: rand() * 10 };
    }),
  );
})();

function Pigeons() {
  const birds = BIRDS;
  const flight = useRef(FLOCKS.map(() => 0)); // seconds left in the air, per flock

  const body = useRef<THREE.InstancedMesh>(null!);
  const wings = useRef<THREE.InstancedMesh>(null!);
  const scratch = useMemo(() => ({ o: new THREE.Object3D(), w: new THREE.Object3D(), m: new THREE.Matrix4() }), []);

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 1 / 30);
    const t = state.clock.elapsedTime;
    const { o, w, m } = scratch;

    FLOCKS.forEach((flock, f) => {
      const d = Math.hypot(car.x - flock.center[0], car.z - flock.center[1]);
      if (d < 10 && Math.abs(car.speed) > 1) flight.current[f] = 7 + Math.random() * 3;
      else flight.current[f] = Math.max(0, flight.current[f] - dt);
    });

    let index = 0;
    FLOCKS.forEach((flock, f) => {
      const flying = flight.current[f] > 0;
      for (let i = 0; i < flock.count; i++, index++) {
        const b = birds[index];
        let tx: number;
        let ty: number;
        let tz: number;
        if (flying) {
          b.angle += dt * (0.6 + (i % 5) * 0.08);
          tx = flock.center[0] + Math.cos(b.angle) * b.radius;
          tz = flock.center[1] + Math.sin(b.angle) * b.radius;
          ty = 7 + (i % 4) * 1.3 + Math.sin(t + b.phase) * 0.6;
        } else {
          tx = b.home[0];
          tz = b.home[1];
          ty = 0;
        }
        const ease = flying ? 2.2 : 1.4;
        const nx = THREE.MathUtils.damp(b.x, tx, ease, dt);
        const nz = THREE.MathUtils.damp(b.z, tz, ease, dt);
        if (Math.hypot(nx - b.x, nz - b.z) > 0.002) b.yaw = Math.atan2(nx - b.x, nz - b.z);
        b.x = nx;
        b.z = nz;
        b.y = THREE.MathUtils.damp(b.y, ty, ease, dt);

        const airborne = b.y > 0.15;
        const peck = airborne ? 0 : Math.max(0, Math.sin(t * 3 + b.phase)) * 0.5;
        o.position.set(b.x, b.y + 0.09, b.z);
        o.rotation.set(peck, b.yaw, 0, "YXZ");
        o.scale.setScalar(1);
        o.updateMatrix();
        body.current.setMatrixAt(index, o.matrix);

        const flap = airborne ? Math.sin(t * 22 + b.phase) * 0.9 : 0.15;
        for (let s = 0; s < 2; s++) {
          const side = s === 0 ? 1 : -1;
          w.position.set(side * 0.06, 0.05, 0);
          w.rotation.set(0, 0, side * flap);
          w.scale.setScalar(1);
          w.updateMatrix();
          m.multiplyMatrices(o.matrix, w.matrix);
          wings.current.setMatrixAt(index * 2 + s, m);
        }
      }
    });
    body.current.instanceMatrix.needsUpdate = true;
    wings.current.instanceMatrix.needsUpdate = true;
  });

  const count = birds.length;
  const wingGeometry = useMemo(() => {
    const g = new THREE.BoxGeometry(0.22, 0.02, 0.13);
    g.translate(0.11, 0, 0); // hinge at the body
    return g;
  }, []);

  return (
    <>
      <instancedMesh ref={body} args={[undefined, undefined, count]} castShadow frustumCulled={false}>
        <boxGeometry args={[0.13, 0.12, 0.26]} />
        <meshStandardMaterial color="#7f8a99" roughness={0.8} />
      </instancedMesh>
      <instancedMesh ref={wings} args={[wingGeometry, undefined, count * 2]} frustumCulled={false}>
        <meshStandardMaterial color="#6b7584" roughness={0.8} side={THREE.DoubleSide} />
      </instancedMesh>
    </>
  );
}

// ---------------------------------------------------------------------------

// The simulation lives at module level (like the car), updated every frame.
const AGENTS = createAgents();
const GROUPS = {
  tourist: AGENTS.filter((a) => a.kind === "tourist"),
  dog: AGENTS.filter((a) => a.kind === "dog"),
  cat: AGENTS.filter((a) => a.kind === "cat"),
};
const behaviourRand = seeded(4242);

/** Tourists, street dogs, cats and pigeons around the squares. */
export default function Npcs() {
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 30);
    for (const a of AGENTS) step(a, dt, behaviourRand);
  });

  return (
    <>
      <Crowd kind="tourist" agents={GROUPS.tourist} />
      <Crowd kind="dog" agents={GROUPS.dog} />
      <Crowd kind="cat" agents={GROUPS.cat} />
      <Pigeons />
    </>
  );
}
