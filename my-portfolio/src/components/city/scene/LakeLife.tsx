"use client";

import { useLayoutEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import {
  BENCH_SEAT,
  crownOf,
  inFrame,
  inLake,
  insideShore,
  KIOSKS,
  LAKE,
  LAKE_BENCHES,
  LAKE_KERB,
  LAKE_LAMPS,
  LAKE_PATH,
  lakeside,
  PLAYGROUND,
  PORTS,
  ringGap,
  seeded,
  SHADE_TREES,
  STALL_SIZE,
  STALLS,
  type Placed,
  type Stall,
  type Vec2,
} from "../layout";
import { PALETTE } from "./parts";

// Life all round Phewa Lake: the stone border along the water, benches,
// lamps and trees, ticket huts and food stalls at the boat landings, a
// playground with kids on the swings, the see-saw, playing football and flying
// a kite, egrets flying over the water, herons in the shallows, ducks paddling
// along the shore, and fish jumping.
//
// Anything there are many of is one instanced mesh; each stall, hut and the
// playground's frames are merged into one coloured mesh, so all of this costs
// a few dozen draw calls.

type V3 = [number, number, number];
const WATER_Y = 0.03;
const yawOf = ([x, z]: Vec2) => Math.atan2(x, z);


// ---------------------------------------------------------------------------
// Helpers: merged coloured parts, and instanced meshes filled once
// ---------------------------------------------------------------------------

interface PartSpec {
  geometry: THREE.BufferGeometry;
  position: V3;
  rotation?: V3;
  scale?: V3;
  color: string;
}

const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
const cylinder = (top: number, bottom: number, h: number, sides = 8) => new THREE.CylinderGeometry(top, bottom, h, sides);
const sphere = (r: number, w = 10, h = 8) => new THREE.SphereGeometry(r, w, h);

/** Many coloured parts as one geometry (colours per vertex), for one draw call. */
function mergeParts(parts: PartSpec[]) {
  const color = new THREE.Color();
  const matrix = new THREE.Matrix4();
  const pieces = parts.map(({ geometry, position, rotation = [0, 0, 0], scale = [1, 1, 1], color: hex }) => {
    const g = geometry.index ? geometry.toNonIndexed() : geometry.clone();
    g.deleteAttribute("uv");
    matrix.compose(
      new THREE.Vector3(...position),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)),
      new THREE.Vector3(...scale),
    );
    g.applyMatrix4(matrix);
    color.set(hex);
    const colors = new Float32Array(g.attributes.position.count * 3);
    for (let i = 0; i < colors.length; i += 3) colors.set([color.r, color.g, color.b], i);
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.dispose();
    return g;
  });
  const merged = mergeGeometries(pieces)!;
  pieces.forEach((g) => g.dispose());
  return merged;
}

const painted = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 });
const paintedTwoSided = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, side: THREE.DoubleSide });

type Setter = (i: number, o: THREE.Object3D, c: THREE.Color) => void;

/** Scratch objects for per-frame instance updates. */
const tmp = {
  o: new THREE.Object3D(),
  m: new THREE.Matrix4(),
  wing: new THREE.Matrix4(),
  q: new THREE.Quaternion(),
  e: new THREE.Euler(),
  v: new THREE.Vector3(),
  one: new THREE.Vector3(1, 1, 1),
};

/** Fills an instanced mesh once: each instance's position, rotation, scale and colour. */
function useInstances(ref: RefObject<THREE.InstancedMesh | null>, count: number, set: Setter) {
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const o = new THREE.Object3D();
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      o.position.set(0, 0, 0);
      o.rotation.set(0, 0, 0);
      o.scale.set(1, 1, 1);
      c.set("#ffffff");
      set(i, o, c);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
      mesh.setColorAt(i, c);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [ref, count, set]);
}

/** Puts `o` at a point given in a placed thing's own frame, turned to match it. */
function placeIn(o: THREE.Object3D, p: Placed, x: number, y: number, z: number) {
  const [wx, wz] = inFrame(p, x, z);
  o.position.set(wx, y, wz);
  o.rotation.y = yawOf(p.facing);
}

// ---------------------------------------------------------------------------
// The stone border along the water
// ---------------------------------------------------------------------------

// One straight length per shore edge, standing just in the water so the
// shore stays open to the grass behind.
const KERB = LAKE.map((a, i) => {
  const b = LAKE[(i + 1) % LAKE.length];
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const length = Math.hypot(dx, dz);
  let [nx, nz] = [-dz / length, dx / length];
  const mid: Vec2 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  if (insideShore(mid[0] + nx * 0.5, mid[1] + nz * 0.5)) [nx, nz] = [-nx, -nz]; // now towards the land
  const w = LAKE_KERB.width / 2;
  return { x: mid[0] - nx * w, z: mid[1] - nz * w, yaw: Math.atan2(dx, dz), length: length + LAKE_KERB.width };
});

const setKerb: Setter = (i, o) => {
  const k = KERB[i];
  o.position.set(k.x, LAKE_KERB.height / 2, k.z);
  o.rotation.y = k.yaw;
  o.scale.set(LAKE_KERB.width, LAKE_KERB.height, k.length);
};

function LakeBorder() {
  const ref = useRef<THREE.InstancedMesh>(null);
  useInstances(ref, KERB.length, setKerb);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, KERB.length]} castShadow receiveShadow>
      <boxGeometry />
      <meshStandardMaterial color={PALETTE.stoneDark} roughness={0.95} />
    </instancedMesh>
  );
}

// ---------------------------------------------------------------------------
// Benches, lamps and trees
// ---------------------------------------------------------------------------

const setSeat: Setter = (i, o) => {
  placeIn(o, LAKE_BENCHES[i], 0, BENCH_SEAT - 0.05, 0);
  o.scale.set(1.8, 0.1, 0.5);
};
const setBack: Setter = (i, o) => {
  placeIn(o, LAKE_BENCHES[i], 0, BENCH_SEAT + 0.3, -0.22);
  o.scale.set(1.8, 0.45, 0.08);
};
const setBenchLeg: Setter = (i, o) => {
  const legHeight = BENCH_SEAT - 0.1;
  placeIn(o, LAKE_BENCHES[i >> 1], i % 2 ? 0.75 : -0.75, legHeight / 2, 0);
  o.scale.set(0.08, legHeight, 0.45);
};

/** Benches facing the water, all round the lake. */
function LakeBenches() {
  const seats = useRef<THREE.InstancedMesh>(null);
  const backs = useRef<THREE.InstancedMesh>(null);
  const legs = useRef<THREE.InstancedMesh>(null);
  const n = LAKE_BENCHES.length;
  useInstances(seats, n, setSeat);
  useInstances(backs, n, setBack);
  useInstances(legs, n * 2, setBenchLeg);
  return (
    <>
      <instancedMesh ref={seats} args={[undefined, undefined, n]} castShadow receiveShadow>
        <boxGeometry />
        <meshStandardMaterial color="#8a6a45" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={backs} args={[undefined, undefined, n]} castShadow>
        <boxGeometry />
        <meshStandardMaterial color="#8a6a45" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={legs} args={[undefined, undefined, n * 2]}>
        <boxGeometry />
        <meshStandardMaterial color="#3f3f46" roughness={0.6} />
      </instancedMesh>
    </>
  );
}

const setLampPost: Setter = (i, o) => o.position.set(LAKE_LAMPS[i][0], 1.6, LAKE_LAMPS[i][1]);
const setLampGlobe: Setter = (i, o) => o.position.set(LAKE_LAMPS[i][0], 3.3, LAKE_LAMPS[i][1]);

/** Lamps along the outer edge of the cycle path. */
function LakeLamps() {
  const posts = useRef<THREE.InstancedMesh>(null);
  const globes = useRef<THREE.InstancedMesh>(null);
  const n = LAKE_LAMPS.length;
  useInstances(posts, n, setLampPost);
  useInstances(globes, n, setLampGlobe);
  return (
    <>
      <instancedMesh ref={posts} args={[undefined, undefined, n]} castShadow>
        <cylinderGeometry args={[0.07, 0.09, 3.2, 8]} />
        <meshStandardMaterial color="#2f3d33" roughness={0.85} />
      </instancedMesh>
      <instancedMesh ref={globes} args={[undefined, undefined, n]}>
        <sphereGeometry args={[0.2, 10, 8]} />
        <meshStandardMaterial color="#fff1c1" roughness={0.4} />
      </instancedMesh>
    </>
  );
}

const setTrunk: Setter = (i, o) => {
  const { at, scale } = SHADE_TREES[i];
  o.position.set(at[0], 1.4 * scale, at[1]);
  o.scale.setScalar(scale);
};
const setCrown: Setter = (i, o, c) => {
  const tree = SHADE_TREES[i];
  o.position.set(tree.at[0], crownOf(tree).y, tree.at[1]);
  o.rotation.y = tree.spin;
  o.scale.setScalar(tree.scale);
  c.set(PALETTE.foliage[tree.shade % PALETTE.foliage.length]);
};

/** Shade trees all round the lake and along Lakeside (the camera keeps out of their crowns). */
function LakeTrees() {
  const trunks = useRef<THREE.InstancedMesh>(null);
  const crowns = useRef<THREE.InstancedMesh>(null);
  const n = SHADE_TREES.length;
  useInstances(trunks, n, setTrunk);
  useInstances(crowns, n, setCrown);
  return (
    <>
      <instancedMesh ref={trunks} args={[undefined, undefined, n]} castShadow>
        <cylinderGeometry args={[0.26, 0.36, 2.8, 7]} />
        <meshStandardMaterial color={PALETTE.trunk} roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={crowns} args={[undefined, undefined, n]} castShadow>
        <icosahedronGeometry args={[2.2, 0]} />
        <meshStandardMaterial roughness={0.9} flatShading />
      </instancedMesh>
    </>
  );
}

// ---------------------------------------------------------------------------
// The boat landings' ticket huts, and the food stalls
// ---------------------------------------------------------------------------

/** A little ticket hut for the boats (front faces +z), with life jackets hung on the side. */
function hutGeometry() {
  return mergeParts([
    { geometry: box(2.4, 2.3, 2.4), position: [0, 1.15, 0], color: "#e9dcc4" },
    { geometry: box(1.3, 0.8, 0.06), position: [0, 1.45, 1.21], color: "#2b2d33" },
    { geometry: box(1.5, 0.08, 0.35), position: [0, 1.02, 1.32], color: "#8a6a45" },
    { geometry: box(2.1, 0.45, 0.08), position: [0, 2.08, 1.24], color: "#2f86b5" },
    { geometry: box(2.1, 0.08, 0.09), position: [0, 1.98, 1.25], color: "#f4f1ea" },
    { geometry: cylinder(0.25, 2.25, 1.1, 4), position: [0, 2.85, 0], rotation: [0, Math.PI / 4, 0], color: "#3f6f5a" },
    ...[-0.6, 0, 0.6].map((z): PartSpec => ({ geometry: box(0.12, 0.5, 0.36), position: [1.27, 1.4, z], color: "#f97316" })),
  ]);
}

function Kiosks() {
  const geometry = useMemo(() => hutGeometry(), []);
  return (
    <>
      {KIOSKS.map((k, i) => (
        <mesh key={i} geometry={geometry} material={painted} position={[k.at[0], 0, k.at[1]]} rotation-y={yawOf(k.facing)} castShadow receiveShadow />
      ))}
    </>
  );
}

const AWNINGS: [string, string][] = [
  ["#d62828", "#f4f1ea"], // momo
  ["#f2c230", "#3f9a4a"], // corn
  ["#2f6fd1", "#f4f1ea"], // tea and fruit
];

/** A food stall (customers' side towards +z): counter, awning and what's cooking. */
function stallGeometry(kind: Stall["kind"]) {
  const { width, depth } = STALL_SIZE;
  const [a, b] = AWNINGS[kind];
  const parts: PartSpec[] = [
    { geometry: box(width - 0.2, 0.9, 0.7), position: [0, 0.45, depth / 2 - 0.4], color: "#8a6a45" },
    { geometry: box(width - 0.1, 0.06, 0.8), position: [0, 0.93, depth / 2 - 0.4], color: "#d8cdb6" },
    { geometry: box(width - 0.4, 0.8, 0.5), position: [0, 0.4, -depth / 2 + 0.3], color: "#6b4f35" },
    ...[-1, 1].flatMap((sx) =>
      [-1, 1].map((sz): PartSpec => ({ geometry: cylinder(0.04, 0.04, 2.35, 6), position: [sx * (width / 2 - 0.05), 1.18, sz * (depth / 2 - 0.05)], color: "#5b3a25" })),
    ),
    // Striped awning, sloping down to the front
    ...Array.from({ length: 5 }, (_, i): PartSpec => ({
      geometry: box((width + 0.3) / 5, 0.05, depth + 0.5),
      position: [-(width + 0.3) / 2 + ((i + 0.5) * (width + 0.3)) / 5, 2.42, 0.1],
      rotation: [0.16, 0, 0],
      color: i % 2 ? b : a,
    })),
  ];
  const top = 0.96;
  const front = depth / 2 - 0.4;
  if (kind === 0) {
    // A bamboo steamer stack, and a plate of momos
    for (let k = 0; k < 3; k++) parts.push({ geometry: cylinder(0.27, 0.27, 0.15, 14), position: [-0.65, top + 0.08 + k * 0.16, front], color: k % 2 ? "#c9a66b" : "#b8935a" });
    parts.push({ geometry: cylinder(0.3, 0.28, 0.03, 16), position: [0.45, top + 0.02, front + 0.05], color: "#f4f1ea" });
    for (let k = 0; k < 6; k++) parts.push({ geometry: sphere(0.06, 8, 6), position: [0.45 + Math.cos(k) * 0.16, top + 0.07, front + 0.05 + Math.sin(k) * 0.16], scale: [1, 0.8, 1], color: "#f6eedc" });
  } else if (kind === 1) {
    // A charcoal grill with corn cobs roasting
    parts.push({ geometry: box(1.1, 0.22, 0.45), position: [-0.3, top + 0.11, front], color: "#2b2b2b" });
    parts.push({ geometry: box(1.0, 0.03, 0.38), position: [-0.3, top + 0.23, front], color: "#e4572e" });
    for (let k = 0; k < 5; k++) parts.push({ geometry: cylinder(0.05, 0.05, 0.36, 8), position: [-0.7 + k * 0.2, top + 0.29, front], rotation: [Math.PI / 2, 0, 0], color: k % 2 ? "#e9b923" : "#d9a21b" });
    parts.push({ geometry: box(0.5, 0.25, 0.4), position: [0.75, top + 0.12, front], color: "#a3b974" });
  } else {
    // A kettle and glasses of tea, and crates of fruit
    parts.push({ geometry: sphere(0.16, 12, 10), position: [-0.7, top + 0.14, front], color: "#b0b7bf" });
    parts.push({ geometry: cylinder(0.02, 0.03, 0.2, 6), position: [-0.53, top + 0.2, front], rotation: [0, 0, -0.9], color: "#b0b7bf" });
    for (let k = 0; k < 4; k++) parts.push({ geometry: cylinder(0.04, 0.035, 0.1, 8), position: [-0.3 + k * 0.12, top + 0.05, front + 0.15], color: "#c47a3a" });
    for (let k = 0; k < 2; k++) {
      parts.push({ geometry: box(0.5, 0.2, 0.4), position: [0.35 + k * 0.55, top + 0.1, front], color: "#a07850" });
      for (let f = 0; f < 6; f++) parts.push({ geometry: sphere(0.07, 8, 6), position: [0.22 + k * 0.55 + (f % 3) * 0.13, top + 0.24, front - 0.08 + Math.floor(f / 3) * 0.16], color: k ? "#e63946" : "#f4a261" });
    }
  }
  return mergeParts(parts);
}

const PUFFS = 3;
const puffMaterial = new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.32, depthWrite: false });

function FoodStall({ stall, index }: { stall: Stall; index: number }) {
  const geometry = useMemo(() => stallGeometry(stall.kind), [stall.kind]);
  const puffs = useRef<(THREE.Mesh | null)[]>([]);
  // Steam off the momos and the tea, smoke off the corn.
  const source: V3 = stall.kind === 0 ? [-0.65, 1.5, STALL_SIZE.depth / 2 - 0.4] : stall.kind === 1 ? [-0.3, 1.25, STALL_SIZE.depth / 2 - 0.4] : [-0.7, 1.35, STALL_SIZE.depth / 2 - 0.4];
  useFrame(({ clock }) => {
    puffs.current.forEach((m, k) => {
      if (!m) return;
      const p = (clock.elapsedTime * 0.45 + k / PUFFS + index * 0.13) % 1;
      m.position.set(source[0] + Math.sin(p * 5 + k) * 0.08, source[1] + p * 0.8, source[2]);
      m.scale.setScalar((0.5 + p * 1.6) * (1 - p ** 3));
    });
  });
  return (
    <group position={[stall.at[0], 0, stall.at[1]]} rotation-y={yawOf(stall.facing)}>
      <mesh geometry={geometry} material={painted} castShadow receiveShadow />
      {Array.from({ length: PUFFS }, (_, k) => (
        <mesh
          key={k}
          ref={(m) => {
            puffs.current[k] = m;
          }}
          material={puffMaterial}
        >
          <sphereGeometry args={[0.12, 8, 6]} />
        </mesh>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// The playground, and the kids in it
// ---------------------------------------------------------------------------

const [PX0, PX1, PZ0, PZ1] = PLAYGROUND;
const SWING = { x: -285.5, z: -89.6, bar: 2.5, rope: 1.75 };
const SEESAW = { x: -278.6, z: -89.2 };

/** The fence, the swings' frame and the see-saw's stand (one mesh). */
function playgroundGeometry() {
  const parts: PartSpec[] = [];
  const wood = "#8a6a45";
  // Fence: posts and two rails all round, with a gap for a gate on the east side.
  const sides: [Vec2, Vec2][] = [
    [[PX0, PZ0], [PX1, PZ0]],
    [[PX1, PZ0], [PX1, -86.6]],
    [[PX1, -84.4], [PX1, PZ1]],
    [[PX1, PZ1], [PX0, PZ1]],
    [[PX0, PZ1], [PX0, PZ0]],
  ];
  for (const [[ax, az], [bx, bz]] of sides) {
    const length = Math.hypot(bx - ax, bz - az);
    const yaw = Math.atan2(bx - ax, bz - az);
    const posts = Math.max(2, Math.round(length / 1.6) + 1);
    for (let i = 0; i < posts; i++) {
      const t = i / (posts - 1);
      parts.push({ geometry: box(0.1, 0.95, 0.1), position: [ax + (bx - ax) * t, 0.47, az + (bz - az) * t], color: wood });
    }
    for (const y of [0.4, 0.8]) parts.push({ geometry: box(0.05, 0.08, length), position: [(ax + bx) / 2, y, (az + bz) / 2], rotation: [0, yaw, 0], color: "#f4f1ea" });
  }
  // The swings' A-frame
  for (const x of [SWING.x - 2.3, SWING.x + 2.3]) {
    for (const lean of [-1, 1]) parts.push({ geometry: box(0.1, 2.7, 0.1), position: [x, 1.25, SWING.z + lean * 0.45], rotation: [lean * -0.36, 0, 0], color: "#d62828" });
  }
  parts.push({ geometry: cylinder(0.06, 0.06, 4.8, 8), position: [SWING.x, SWING.bar, SWING.z], rotation: [0, 0, Math.PI / 2], color: "#d62828" });
  // The see-saw's stand
  parts.push({ geometry: box(0.35, 0.5, 0.45), position: [SEESAW.x, 0.25, SEESAW.z], color: "#2f6fd1" });
  // A sandpit corner
  parts.push({ geometry: box(3, 0.12, 2.4), position: [PX0 + 2, 0.06, PZ1 - 1.6], color: "#e6d3a3" });
  return mergeParts(parts);
}

interface KidLook {
  shirt: string;
  pants: string;
  skin: string;
  hair: string;
}
interface KidPose {
  x: number;
  y: number;
  z: number;
  yaw: number;
  /** Leg swing (radians; opposite legs swing opposite ways), or both forward when sitting. */
  legs: number;
  /** Arm swing, likewise; `armsTogether` raises both together. */
  arms: number;
  sit: boolean;
  armsTogether?: boolean;
}
type Poser = (t: number, out: KidPose) => void;

/** A child: body and head as one mesh, arms and legs that swing. */
function Kid({ look, pose }: { look: KidLook; pose: Poser }) {
  const root = useRef<THREE.Group>(null!);
  const legs = useRef<(THREE.Group | null)[]>([]);
  const arms = useRef<(THREE.Group | null)[]>([]);
  const state = useRef<KidPose>({ x: 0, y: 0, z: 0, yaw: 0, legs: 0, arms: 0, sit: false });
  const body = useMemo(
    () =>
      mergeParts([
        { geometry: box(0.3, 0.42, 0.18), position: [0, 0.78, 0], color: look.shirt },
        { geometry: sphere(0.14, 12, 10), position: [0, 1.12, 0], color: look.skin },
        { geometry: new THREE.SphereGeometry(0.15, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), position: [0, 1.14, -0.01], color: look.hair },
      ]),
    [look],
  );
  useFrame(({ clock }) => {
    const p = state.current;
    pose(clock.elapsedTime, p);
    root.current.position.set(p.x, p.y, p.z);
    root.current.rotation.y = p.yaw;
    legs.current.forEach((g, i) => {
      if (g) g.rotation.x = p.sit ? -1.4 + (i ? p.legs : -p.legs) * 0.3 : i ? p.legs : -p.legs;
    });
    arms.current.forEach((g, i) => {
      if (g) g.rotation.x = p.armsTogether ? p.arms : i ? -p.arms : p.arms;
    });
  });
  return (
    <group ref={root}>
      <mesh geometry={body} material={painted} castShadow />
      {[-1, 1].map((side, i) => (
        <group
          key={`leg${side}`}
          position={[side * 0.08, 0.56, 0]}
          ref={(g) => {
            legs.current[i] = g;
          }}
        >
          <mesh position-y={-0.27} castShadow>
            <boxGeometry args={[0.11, 0.54, 0.13]} />
            <meshStandardMaterial color={look.pants} roughness={0.9} />
          </mesh>
        </group>
      ))}
      {[-1, 1].map((side, i) => (
        <group
          key={`arm${side}`}
          position={[side * 0.2, 0.96, 0]}
          ref={(g) => {
            arms.current[i] = g;
          }}
        >
          <mesh position-y={-0.17} castShadow>
            <boxGeometry args={[0.08, 0.36, 0.09]} />
            <meshStandardMaterial color={look.shirt} roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

const KIDS: KidLook[] = [
  { shirt: "#e63946", pants: "#1d3557", skin: "#c68642", hair: "#1b1b1b" },
  { shirt: "#2a9d8f", pants: "#3d405b", skin: "#e0ac69", hair: "#2b1d14" },
  { shirt: "#f4a261", pants: "#264653", skin: "#8d5524", hair: "#111111" },
  { shirt: "#7c3aed", pants: "#2b2d42", skin: "#c68642", hair: "#3a2416" },
  { shirt: "#f2c230", pants: "#1d4ed8", skin: "#e0ac69", hair: "#1b1b1b" },
  { shirt: "#16a34a", pants: "#3d405b", skin: "#8d5524", hair: "#2b1d14" },
  { shirt: "#ffffff", pants: "#e11d48", skin: "#c68642", hair: "#111111" },
];

// Football: two kids pass the ball back and forth across the grass.
const PASS = 1.7;
const KICKER_X = [-287.4, -276.8];
const PITCH_Z = -82.4;
/** Where (across the pitch) pass `n` is aimed. */
const aim = (n: number) => PITCH_Z + Math.sin(n * 2.3) * 1.3;
const smooth = (u: number) => u * u * (3 - 2 * u);

function footballer(side: 0 | 1): Poser {
  return (t, out) => {
    const n = Math.floor(t / PASS);
    const u = t / PASS - n;
    // Pass n goes from kid 0 to kid 1 when n is even, back when it's odd.
    const receiving = (n % 2 === 0) === (side === 1);
    out.x = KICKER_X[side] + (receiving ? 0 : Math.sin(u * Math.PI) * 0.15 * (side ? -1 : 1));
    out.z = receiving ? aim(n - 2) + (aim(n) - aim(n - 2)) * smooth(u) : aim(n - 1);
    out.y = 0;
    out.yaw = side ? -Math.PI / 2 : Math.PI / 2;
    out.sit = false;
    out.armsTogether = false;
    const moving = receiving && u < 0.8 ? Math.abs(aim(n) - aim(n - 2)) : 0;
    out.legs = receiving ? Math.sin(t * 13) * 0.5 * Math.min(1, moving) : u < 0.18 ? Math.sin((u / 0.18) * Math.PI) * 0.9 : 0;
    out.arms = receiving ? Math.sin(t * 13) * 0.4 * Math.min(1, moving) : 0.25;
  };
}

function Football() {
  const ball = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const n = Math.floor(t / PASS);
    const u = t / PASS - n;
    const from = n % 2 === 0 ? 0 : 1;
    const dir = from === 0 ? 1 : -1;
    const x0 = KICKER_X[from] + dir * 0.45;
    const x1 = KICKER_X[1 - from] - dir * 0.45;
    ball.current.position.set(x0 + (x1 - x0) * u, 0.11 + Math.abs(Math.sin(u * Math.PI * 2)) * 0.18 * (1 - u), aim(n - 1) + (aim(n) - aim(n - 1)) * u);
    ball.current.rotation.z = -dir * u * 14;
  });
  return (
    <>
      <mesh ref={ball} castShadow>
        <icosahedronGeometry args={[0.11, 1]} />
        <meshStandardMaterial color="#f4f1ea" roughness={0.6} flatShading />
      </mesh>
      <Kid look={KIDS[0]} pose={footballer(0)} />
      <Kid look={KIDS[1]} pose={footballer(1)} />
    </>
  );
}

// Swings: each kid sits on a seat hanging from the bar, swinging back and forth.
const swingAngle = (t: number, k: number) => 0.6 * Math.sin((t * Math.PI * 2) / 2.5 + k * 1.9);
const swinger =
  (k: number): Poser =>
  (t, out) => {
    out.x = 0;
    out.y = -SWING.rope + 0.04 - 0.56;
    out.z = 0;
    out.yaw = 0;
    out.sit = true;
    out.armsTogether = true;
    out.arms = -2.75;
    // Pumping: legs out on the way forward, tucked on the way back.
    out.legs = Math.cos((t * Math.PI * 2) / 2.5 + k * 1.9);
  };

function Swings() {
  const seats = useRef<(THREE.Group | null)[]>([]);
  useFrame(({ clock }) => {
    seats.current.forEach((g, k) => {
      if (g) g.rotation.x = swingAngle(clock.elapsedTime, k);
    });
  });
  return (
    <>
      {[-1.1, 1.1].map((dx, k) => (
        <group
          key={k}
          position={[SWING.x + dx, SWING.bar, SWING.z]}
          ref={(g) => {
            seats.current[k] = g;
          }}
        >
          {[-0.24, 0.24].map((rx) => (
            <mesh key={rx} position={[rx, -SWING.rope / 2, 0]}>
              <boxGeometry args={[0.02, SWING.rope, 0.02]} />
              <meshStandardMaterial color="#9aa1a9" />
            </mesh>
          ))}
          <mesh position-y={-SWING.rope} castShadow>
            <boxGeometry args={[0.55, 0.05, 0.26]} />
            <meshStandardMaterial color="#2f6fd1" />
          </mesh>
          <Kid look={KIDS[2 + k]} pose={swinger(k)} />
        </group>
      ))}
    </>
  );
}

// The see-saw: a kid at each end, facing each other.
const seesawTilt = (t: number) => 0.24 * Math.sin((t * Math.PI * 2) / 2.3);
const seesawRider =
  (side: -1 | 1): Poser =>
  (t, out) => {
    out.x = side * 1.45;
    out.y = 0.04 - 0.56;
    out.z = 0;
    out.yaw = -side * (Math.PI / 2);
    out.sit = true;
    out.armsTogether = true;
    out.arms = -1.25;
    out.legs = 0.6 * Math.sin((t * Math.PI * 2) / 2.3) * side;
  };

function SeeSaw() {
  const plank = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => {
    plank.current.rotation.z = seesawTilt(clock.elapsedTime);
  });
  return (
    <group ref={plank} position={[SEESAW.x, 0.55, SEESAW.z]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[3.6, 0.08, 0.32]} />
        <meshStandardMaterial color="#f2c230" roughness={0.8} />
      </mesh>
      {[-1.3, 1.3].map((x) => (
        <mesh key={x} position={[x, 0.22, 0]}>
          <boxGeometry args={[0.05, 0.4, 0.3]} />
          <meshStandardMaterial color="#d62828" />
        </mesh>
      ))}
      <Kid look={KIDS[4]} pose={seesawRider(-1)} />
      <Kid look={KIDS[5]} pose={seesawRider(1)} />
    </group>
  );
}

// A kite flying high over the playground, and the kid holding its string.
const KITE_KID: Vec2 = [-276.6, -80.6];
const kitePosition = (t: number, out: THREE.Vector3) =>
  out.set(-284 + Math.sin(t * 0.27) * 4, 17 + Math.sin(t * 0.43) * 2.4, -104 + Math.cos(t * 0.31) * 3);
const kiteAt = new THREE.Vector3();
const kiteFlyer: Poser = (t, out) => {
  kitePosition(t, kiteAt);
  out.x = KITE_KID[0];
  out.y = 0;
  out.z = KITE_KID[1];
  out.yaw = Math.atan2(kiteAt.x - KITE_KID[0], kiteAt.z - KITE_KID[1]);
  out.sit = false;
  out.armsTogether = true;
  out.arms = -2.25 + Math.sin(t * 1.3) * 0.15;
  out.legs = 0;
};

function Kite() {
  const kite = useRef<THREE.Group>(null!);
  const string = useRef<THREE.Mesh>(null!);
  const hand = useMemo(() => new THREE.Vector3(), []);
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const span = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const at = kitePosition(t, kite.current.position);
    kite.current.lookAt(KITE_KID[0], 1.5, KITE_KID[1]);
    kite.current.rotateZ(Math.sin(t * 1.7) * 0.25);
    // The string, from the raised hands up to the kite
    const yaw = Math.atan2(at.x - KITE_KID[0], at.z - KITE_KID[1]);
    hand.set(KITE_KID[0] + Math.sin(yaw) * 0.3, 1.55, KITE_KID[1] + Math.cos(yaw) * 0.3);
    span.subVectors(at, hand);
    const length = span.length();
    string.current.position.copy(hand).addScaledVector(span, 0.5);
    string.current.quaternion.setFromUnitVectors(up, span.normalize());
    string.current.scale.set(1, length, 1);
  });
  return (
    <>
      <group ref={kite}>
        <mesh rotation-z={Math.PI / 4} geometry={kiteGeometry} material={paintedTwoSided} />
      </group>
      <mesh ref={string}>
        <cylinderGeometry args={[0.012, 0.012, 1, 4]} />
        <meshBasicMaterial color="#f4f1ea" />
      </mesh>
      <Kid look={KIDS[6]} pose={kiteFlyer} />
    </>
  );
}

// A diamond kite in quarters of colour, with a tail of bows.
const kiteGeometry = mergeParts([
  { geometry: new THREE.PlaneGeometry(0.6, 0.6), position: [-0.3, 0.3, 0], color: "#e63946" },
  { geometry: new THREE.PlaneGeometry(0.6, 0.6), position: [0.3, 0.3, 0], color: "#f2c230" },
  { geometry: new THREE.PlaneGeometry(0.6, 0.6), position: [-0.3, -0.3, 0], color: "#f2c230" },
  { geometry: new THREE.PlaneGeometry(0.6, 0.6), position: [0.3, -0.3, 0], color: "#e63946" },
  ...[0, 1, 2, 3].map((k): PartSpec => ({ geometry: new THREE.PlaneGeometry(0.14, 0.14), position: [-0.7 - k * 0.35, -0.7 - k * 0.35, 0], color: k % 2 ? "#2f6fd1" : "#16a34a" })),
]);

function Playground() {
  const frame = useMemo(() => playgroundGeometry(), []);
  return (
    <>
      <mesh geometry={frame} material={painted} castShadow receiveShadow />
      <mesh rotation-x={-Math.PI / 2} position={[(PX0 + PX1) / 2, 0.006, (PZ0 + PZ1) / 2]} receiveShadow>
        <planeGeometry args={[PX1 - PX0, PZ1 - PZ0]} />
        <meshStandardMaterial color="#b9c98a" roughness={1} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
      </mesh>
      <Swings />
      <SeeSaw />
      <Football />
      <Kite />
    </>
  );
}

// ---------------------------------------------------------------------------
// Birds: egrets flying over the water, herons in the shallows, ducks
// ---------------------------------------------------------------------------

const egretBody = mergeParts([
  { geometry: sphere(0.14, 10, 8), position: [0, 0, 0], scale: [1, 0.9, 2.6], color: "#fbfbf8" },
  { geometry: sphere(0.07, 8, 6), position: [0, 0.07, 0.42], color: "#fbfbf8" },
  { geometry: new THREE.ConeGeometry(0.025, 0.18, 6), position: [0, 0.06, 0.55], rotation: [Math.PI / 2, 0, 0], color: "#e9b923" },
  { geometry: cylinder(0.012, 0.012, 0.4, 4), position: [0, -0.02, -0.5], rotation: [Math.PI / 2, 0, 0], color: "#2b2b2b" },
]);
/** A wing reaching out to +x from the shoulder (the left wing is the same, mirrored). */
const wingGeometry = (side: 1 | -1) => {
  const g = new THREE.BoxGeometry(0.8, 0.02, 0.3);
  g.translate(side * 0.4, 0, 0);
  return g;
};
const RIGHT_WING = wingGeometry(1);
const LEFT_WING = wingGeometry(-1);

// Three flocks fly round over the water in loose Vs.
const FLOCKS = [
  { s: 40, dir: 1, d: -20, height: 12, speed: 7.5 },
  { s: 320, dir: -1, d: -30, height: 15, speed: 6.5 },
  { s: 560, dir: 1, d: -40, height: 13, speed: 7 },
];
const PER_FLOCK = 5;
const FLYERS = FLOCKS.length * PER_FLOCK;


function Egrets() {
  const bodies = useRef<THREE.InstancedMesh>(null!);
  const rights = useRef<THREE.InstancedMesh>(null!);
  const lefts = useRef<THREE.InstancedMesh>(null!);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    let i = 0;
    for (const f of FLOCKS) {
      for (let k = 0; k < PER_FLOCK; k++, i++) {
        // V formation: each bird a little behind and to one side of the one before.
        const back = Math.ceil(k / 2) * 2.2;
        const side = (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 1.6;
        const s = f.s + f.dir * (t * f.speed - back);
        const { at } = lakeside(s, f.d + side * f.dir);
        const [tx, tz] = LAKE_PATH.tangents[Math.floor(((s % LAKE_PATH.length) + LAKE_PATH.length) % LAKE_PATH.length)];
        const yaw = Math.atan2(tx * f.dir, tz * f.dir);
        const flap = Math.sin(t * 7 + i * 1.3) * 0.55;
        tmp.e.set(0, yaw, Math.sin(t * 0.6 + i) * 0.12, "YXZ");
        tmp.q.setFromEuler(tmp.e);
        tmp.v.set(at[0], f.height + k * 0.35 + Math.sin(t * 1.4 + i) * 0.3, at[1]);
        tmp.m.compose(tmp.v, tmp.q, tmp.one);
        bodies.current.setMatrixAt(i, tmp.m);
        for (const [mesh, sign] of [[rights.current, 1], [lefts.current, -1]] as const) {
          tmp.o.position.set(sign * 0.1, 0.04, 0.05);
          tmp.o.rotation.set(0, 0, sign * flap);
          tmp.o.updateMatrix();
          tmp.wing.multiplyMatrices(tmp.m, tmp.o.matrix);
          mesh.setMatrixAt(i, tmp.wing);
        }
      }
    }
    for (const mesh of [bodies.current, rights.current, lefts.current]) {
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    }
  });
  return (
    <>
      <instancedMesh ref={bodies} args={[egretBody, painted, FLYERS]} castShadow />
      <instancedMesh ref={rights} args={[RIGHT_WING, undefined, FLYERS]}>
        <meshStandardMaterial color="#f4f4f0" roughness={0.8} side={THREE.DoubleSide} />
      </instancedMesh>
      <instancedMesh ref={lefts} args={[LEFT_WING, undefined, FLYERS]}>
        <meshStandardMaterial color="#f4f4f0" roughness={0.8} side={THREE.DoubleSide} />
      </instancedMesh>
    </>
  );
}

// Herons standing in the shallows just past the border, now and then dipping for a fish.
const heronGeometry = mergeParts([
  { geometry: sphere(0.17, 10, 8), position: [0, 0.95, 0], scale: [0.9, 0.9, 1.9], color: "#c9ced6" },
  { geometry: cylinder(0.035, 0.045, 0.55, 6), position: [0, 1.25, 0.25], rotation: [0.45, 0, 0], color: "#dfe3e8" },
  { geometry: sphere(0.07, 8, 6), position: [0, 1.5, 0.37], color: "#e9edf1" },
  { geometry: new THREE.ConeGeometry(0.025, 0.22, 6), position: [0, 1.49, 0.52], rotation: [Math.PI / 2, 0, 0], color: "#e9b923" },
  { geometry: cylinder(0.015, 0.015, 0.85, 4), position: [-0.06, 0.43, 0], color: "#4a4a4a" },
  { geometry: cylinder(0.015, 0.015, 0.85, 4), position: [0.06, 0.43, 0], color: "#4a4a4a" },
]);
const herons: Placed[] = Array.from({ length: 9 }, (_, k) => 37 + k * 81)
  .filter((s) => PORTS.every((p) => ringGap(p.s, s) > 14))
  .map((s) => lakeside(s, -1.1))
  .filter(({ at }) => Math.hypot(at[0] + 308, at[1] - 24) > 10); // not under Lakeside's jetty

function Herons() {
  const ref = useRef<THREE.InstancedMesh>(null!);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    herons.forEach((h, i) => {
      // Mostly still; every so often a quick dip.
      const cycle = (t + i * 3.7) % 9;
      const dip = cycle < 0.8 ? Math.sin((cycle / 0.8) * Math.PI) * 0.6 : 0;
      tmp.e.set(dip, yawOf(h.facing) + Math.sin(t * 0.2 + i) * 0.4, 0, "YXZ");
      tmp.q.setFromEuler(tmp.e);
      tmp.v.set(h.at[0], -0.25, h.at[1]);
      tmp.m.compose(tmp.v, tmp.q, tmp.one);
      ref.current.setMatrixAt(i, tmp.m);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[heronGeometry, painted, herons.length]} castShadow frustumCulled={false} />;
}

// Ducks: families paddling to and fro along the shore, ducklings in a line behind.
const duckGeometry = mergeParts([
  { geometry: sphere(0.16, 10, 8), position: [0, 0.08, 0], scale: [0.85, 0.7, 1.4], color: "#8b6b4a" },
  { geometry: sphere(0.08, 8, 6), position: [0, 0.24, 0.17], color: "#2e6b3f" },
  { geometry: box(0.06, 0.03, 0.09), position: [0, 0.22, 0.27], color: "#e9a23b" },
  { geometry: box(0.1, 0.04, 0.12), position: [0, 0.16, -0.22], rotation: [0.5, 0, 0], color: "#5b4632" },
]);
const DUCKLINGS = 3;
// Stretches of shore clear of the landings and Lakeside's jetty.
const FAMILIES = [30, 150, 260, 380, 500, 610, 690]
  .map((s, f) => ({ s, f }))
  .filter(({ s }) => PORTS.every((p) => ringGap(p.s, s) > 32))
  .filter(({ s }) => [-16, 0, 16].every((ds) => Math.hypot(lakeside(s + ds, -2.6).at[0] + 308, lakeside(s + ds, -2.6).at[1] - 24) > 14));
const SWIMMERS = FAMILIES.length * (1 + DUCKLINGS);

function Ducks() {
  const ref = useRef<THREE.InstancedMesh>(null!);
  useLayoutEffect(() => {
    const c = new THREE.Color();
    for (let i = 0; i < SWIMMERS; i++) ref.current.setColorAt(i, c.set(i % (1 + DUCKLINGS) ? "#f0e08a" : "#ffffff"));
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
  }, []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    let i = 0;
    for (const { s: centre, f } of FAMILIES) {
      for (let k = 0; k <= DUCKLINGS; k++, i++) {
        // Each duckling follows the same course a moment later.
        const tk = t - k * 1.6;
        const phase = tk * 0.025 + f;
        const s = centre + Math.sin(phase) * 16;
        const forward = Math.cos(phase) >= 0 ? 1 : -1;
        const { at } = lakeside(s, -2.6 + Math.sin(tk * 0.3 + f) * 0.4);
        const [tx, tz] = LAKE_PATH.tangents[Math.floor(((s % LAKE_PATH.length) + LAKE_PATH.length) % LAKE_PATH.length)];
        tmp.e.set(0, Math.atan2(tx * forward, tz * forward), Math.sin(tk * 2 + k) * 0.05, "YXZ");
        tmp.q.setFromEuler(tmp.e);
        tmp.v.set(at[0], WATER_Y - 0.02 + Math.sin(tk * 2.2 + k) * 0.015, at[1]);
        const scale = k ? 0.5 : 1;
        tmp.m.compose(tmp.v, tmp.q, tmp.o.scale.set(scale, scale, scale));
        ref.current.setMatrixAt(i, tmp.m);
      }
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[duckGeometry, painted, SWIMMERS]} frustumCulled={false} />;
}

// ---------------------------------------------------------------------------
// Fish jumping out of the water, with ripples where they go in and out
// ---------------------------------------------------------------------------

const fishGeometry = mergeParts([
  { geometry: sphere(0.1, 10, 8), position: [0, 0, 0], scale: [0.7, 1, 3], color: "#9fb3bd" },
  { geometry: new THREE.ConeGeometry(0.1, 0.18, 4), position: [0, 0, -0.38], rotation: [-Math.PI / 2, 0, 0], scale: [0.25, 1, 1], color: "#7f95a0" },
]);
const JUMPERS = 8;
const JUMP = 0.85;
const fishRand = seeded(717);
interface Jumper {
  x: number;
  z: number;
  heading: number;
  start: number;
  wait: number;
}
const jumpers: Jumper[] = Array.from({ length: JUMPERS }, (_, i) => ({ x: 0, z: 0, heading: 0, start: -10, wait: i * 0.9 }));

/** A fresh spot out on the water, clear of the shore and the island. */
function newSpot(j: Jumper, now: number) {
  for (let tries = 0; tries < 30; tries++) {
    const x = -470 + fishRand() * 165;
    const z = -112 + fishRand() * 222;
    if (inLake(x, z, 6)) {
      j.x = x;
      j.z = z;
      break;
    }
  }
  j.heading = fishRand() * Math.PI * 2;
  j.start = now;
  j.wait = 2 + fishRand() * 6;
}

function JumpingFish() {
  const fish = useRef<THREE.InstancedMesh>(null!);
  const rings = useRef<THREE.InstancedMesh>(null!);
  const water = useMemo(() => new THREE.Color("#3f88a6"), []);
  const foam = useMemo(() => new THREE.Color("#eef7fa"), []);
  const shade = useMemo(() => new THREE.Color(), []);
  useFrame(({ clock }) => {
    const now = clock.elapsedTime;
    jumpers.forEach((j, i) => {
      if (now > j.start + JUMP + j.wait) newSpot(j, now);
      const u = (now - j.start) / JUMP;
      const [dx, dz] = [Math.sin(j.heading), Math.cos(j.heading)];
      if (u >= 0 && u <= 1) {
        // An arc out of the water and back in, nose following the arc.
        const rise = (4 * (1 - 2 * u) * 0.9) / 1.4;
        tmp.e.set(-Math.atan(rise), j.heading, 0, "YXZ");
        tmp.q.setFromEuler(tmp.e);
        tmp.v.set(j.x + dx * 1.4 * u, -0.15 + 0.9 * 4 * u * (1 - u), j.z + dz * 1.4 * u);
        tmp.m.compose(tmp.v, tmp.q, tmp.one);
      } else tmp.m.makeScale(0, 0, 0);
      fish.current.setMatrixAt(i, tmp.m);
      // Ripples where it leaves the water and where it lands.
      for (let r = 0; r < 2; r++) {
        const age = now - j.start - r * JUMP;
        const k = i * 2 + r;
        if (age < 0 || age > 1.6) {
          tmp.m.makeScale(0, 0, 0);
        } else {
          const size = 0.25 + age * 1.3;
          tmp.v.set(j.x + dx * 1.4 * r, WATER_Y + 0.02, j.z + dz * 1.4 * r);
          tmp.q.setFromEuler(tmp.e.set(-Math.PI / 2, 0, 0));
          tmp.m.compose(tmp.v, tmp.q, tmp.o.scale.set(size, size, size));
          rings.current.setColorAt(k, shade.copy(foam).lerp(water, age / 1.6));
        }
        rings.current.setMatrixAt(k, tmp.m);
      }
    });
    fish.current.instanceMatrix.needsUpdate = true;
    rings.current.instanceMatrix.needsUpdate = true;
    if (rings.current.instanceColor) rings.current.instanceColor.needsUpdate = true;
  });
  return (
    <>
      <instancedMesh ref={fish} args={[fishGeometry, painted, JUMPERS]} frustumCulled={false} />
      <instancedMesh ref={rings} args={[undefined, undefined, JUMPERS * 2]} frustumCulled={false}>
        <ringGeometry args={[0.85, 1, 32]} />
        <meshBasicMaterial color="#ffffff" depthWrite={false} polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-2} />
      </instancedMesh>
    </>
  );
}

/** Everything round the lake (its jetties and moored boats are with Lakeside's, in Pokhara). */
export default function LakeLife() {
  return (
    <>
      <LakeBorder />
      <LakeBenches />
      <LakeLamps />
      <LakeTrees />
      <Kiosks />
      {STALLS.map((stall, i) => (
        <FoodStall key={i} stall={stall} index={i} />
      ))}
      <Playground />
      <Egrets />
      <Herons />
      <Ducks />
      <JumpingFish />
    </>
  );
}
