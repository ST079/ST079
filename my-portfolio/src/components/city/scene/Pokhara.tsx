"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";

import {
  LAKE,
  LAKE_HILLS,
  LAKE_PATH,
  LAKE_PATH_HALF_WIDTH,
  LAKE_PATH_LANE,
  lakePathAt,
  BENCH_SEAT,
  LAKESIDE,
  LAKESIDE_BENCHES,
  LAKESIDE_LAMPS,
  POKHARA_AREA,
  PORT_JETTY,
  PORTS,
  ROAD2,
  seeded,
  TERRACES,
  type Vec2,
} from "../layout";
import { car, driveToPoint } from "../store";
import { Box, mat, PALETTE, RectFrustum } from "./parts";
import { Pinnacle } from "./buildings/pagoda";
import { getStoneTexture } from "./Environment";
import LakeLife from "./LakeLife";
import { Rider, Tube } from "./vehicles";

// Pokhara: Lakeside's promenade on Phewa Lake, with rowing boats out on the
// water, Tal Barahi temple on its island (the Contact stop), a cycle path all
// the way round the lake, the World Peace Pagoda on the hill across the lake
// and paragliders over Sarangkot.
// On the way there: rice terraces, prayer flags and a gateway into town.

const WATER_Y = 0.03;
const SHORE_X = LAKESIDE[0];
const WHITE = "#f4f1ea";
const LIFE_JACKET = "#f97316";
const SKIN = ["#c68642", "#e0ac69", "#8d5524", "#f1c27d"];

// ---------------------------------------------------------------------------
// The lake
// ---------------------------------------------------------------------------

let waterNormals: THREE.CanvasTexture | null = null;

/** A tiling normal map of soft ripples, drawn once and scrolled to make the water move. */
function getWaterNormals() {
  if (waterNormals) return waterNormals;
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const image = ctx.createImageData(size, size);
  // Height field: a few sine waves that tile seamlessly.
  const height = (x: number, y: number) => {
    const u = (x / size) * Math.PI * 2;
    const v = (y / size) * Math.PI * 2;
    return Math.sin(u * 3 + v * 2) * 0.5 + Math.sin(u * 5 - v * 4) * 0.3 + Math.sin(v * 7 + u) * 0.2;
  };
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = height(x + 1, y) - height(x - 1, y);
      const dy = height(x, y + 1) - height(x, y - 1);
      const n = new THREE.Vector3(-dx * 6, -dy * 6, 1).normalize();
      const i = (y * size + x) * 4;
      image.data[i] = (n.x * 0.5 + 0.5) * 255;
      image.data[i + 1] = (n.y * 0.5 + 0.5) * 255;
      image.data[i + 2] = (n.z * 0.5 + 0.5) * 255;
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  waterNormals = new THREE.CanvasTexture(canvas);
  waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;
  waterNormals.repeat.set(18, 18);
  return waterNormals;
}

function Lake() {
  const geometry = useMemo(() => {
    // The shape is drawn in x/y with y = -z, then laid flat.
    const shape = new THREE.Shape(LAKE.map(([x, z]) => new THREE.Vector2(x, -z)));
    const g = new THREE.ShapeGeometry(shape, 2);
    g.rotateX(-Math.PI / 2);
    // UVs in world units, so the ripples keep their size.
    const uv = g.attributes.uv;
    const pos = g.attributes.position;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / 160, pos.getZ(i) / 160);
    return g;
  }, []);
  const normals = useMemo(() => getWaterNormals(), []);

  useFrame((_, dt) => {
    const n = getWaterNormals();
    n.offset.x = (n.offset.x + dt * 0.004) % 1;
    n.offset.y = (n.offset.y + dt * 0.0025) % 1;
  });

  return (
    <>
      <mesh geometry={geometry} position-y={WATER_Y} receiveShadow>
        <meshStandardMaterial
          color="#3f88a6"
          roughness={0.16}
          metalness={0.25}
          normalMap={normals}
          normalScale={new THREE.Vector2(0.35, 0.35)}
          side={THREE.DoubleSide}
        />
      </mesh>
    </>
  );
}

// ---------------------------------------------------------------------------
// Boats
// ---------------------------------------------------------------------------

/** A doonga hull, bow towards +z, from y = 0 up to `depth`. */
function hullGeometry(scale = 1, depth = 0.5) {
  const outline: Vec2[] = [
    [0, 2.15], [0.48, 1.3], [0.56, 0], [0.5, -1.3], [0.28, -2.05], [-0.28, -2.05], [-0.5, -1.3], [-0.56, 0], [-0.48, 1.3],
  ];
  // Drawn in x/y with y = -z so that, laid flat and extruded, it rises along +y.
  const shape = new THREE.Shape(outline.map(([x, z]) => new THREE.Vector2(x * scale, -z * scale)));
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  g.rotateX(-Math.PI / 2);
  return g;
}
const HULL = hullGeometry();
/** A white band round the hull, just below the gunwale (its top stays under the deck's, so they never fight). */
const STRIPE = hullGeometry(1.03, 0.08);
/** The wooden deck, inset within the gunwale and standing just proud of the hull's top. */
const DECK = hullGeometry(0.86, 0.03);
const WAKE_MATERIAL = new THREE.MeshBasicMaterial({
  color: "#e8f4f8",
  transparent: true,
  opacity: 0.3,
  depthWrite: false,
  polygonOffset: true,
  polygonOffsetFactor: -2,
  polygonOffsetUnits: -2,
});
/** How deep the hulls sit in the water. */
const DRAFT = 0.15;

/** Someone sat in a boat (facing +z), optionally in a life jacket. */
function Sitter({ z, jacket, skin, face = 1 }: { z: number; jacket: string; skin: string; face?: 1 | -1 }) {
  return (
    <group position-z={z} rotation-y={face < 0 ? Math.PI : 0}>
      <Box size={[0.36, 0.2, 0.34]} position={[0, 0.5, 0]} color="#3d405b" />
      <Box size={[0.4, 0.48, 0.26]} position={[0, 0.85, 0]} color={jacket} />
      <mesh position-y={1.22} material={mat(skin)} castShadow>
        <sphereGeometry args={[0.13, 12, 10]} />
      </mesh>
    </group>
  );
}

interface BoatSpec {
  color: string;
  canopy?: string;
  passengers: number;
  /** Loop: centre, radii, starting angle, angular direction and speed (m/s). */
  loop?: { cx: number; cz: number; a: number; b: number; angle: number; dir: 1 | -1; speed: number };
  /** Or moored at a fixed spot. */
  at?: { x: number; z: number; heading: number };
}

function Boat({ spec, index }: { spec: BoatSpec; index: number }) {
  const root = useRef<THREE.Group>(null!);
  const oar = useRef<THREE.Group>(null!);
  const wake = useRef<THREE.Mesh>(null!);
  const angle = useRef(spec.loop?.angle ?? 0);
  const skin = SKIN[index % SKIN.length];

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 1 / 30);
    const t = clock.elapsedTime + index * 1.7;
    const bob = Math.sin(t * 1.3) * 0.04;
    if (spec.loop) {
      const { cx, cz, a, b, dir, speed } = spec.loop;
      // Advance by arc length, so speed is the same round the whole ellipse.
      const th = angle.current;
      const step = Math.hypot(a * Math.sin(th), b * Math.cos(th)) || 1;
      angle.current += (dir * speed * dt) / step;
      const x = cx + a * Math.cos(angle.current);
      const z = cz + b * Math.sin(angle.current);
      const vx = -a * Math.sin(angle.current) * dir;
      const vz = b * Math.cos(angle.current) * dir;
      const heading = Math.atan2(vx, vz);
      root.current.position.set(x, WATER_Y - DRAFT + bob, z);
      root.current.rotation.set(0, heading, Math.sin(t * 1.1) * 0.03);
      oar.current.rotation.x = Math.sin(t * 2.4) * 0.5;
      // The wake lies flat on the water behind the stern, whatever the boat's rocking.
      wake.current.position.set(x - Math.sin(heading) * 1.9, WATER_Y + 0.012, z - Math.cos(heading) * 1.9);
      wake.current.rotation.set(-Math.PI / 2, heading, 0, "YXZ");
      wake.current.visible = true;
    } else if (spec.at) {
      root.current.position.set(spec.at.x, WATER_Y - DRAFT + bob * 0.6, spec.at.z);
      root.current.rotation.set(0, spec.at.heading, Math.sin(t * 0.9) * 0.02);
      wake.current.visible = false;
    }
  });

  return (
    <>
      <group ref={root}>
        <mesh geometry={HULL} material={mat(spec.color, 0.6)} castShadow receiveShadow />
        <mesh geometry={STRIPE} position-y={0.36} material={mat(WHITE, 0.6)} />
        <mesh geometry={DECK} position-y={0.5} material={mat("#8a6a45", 0.8)} receiveShadow />
        {spec.canopy && (
          <group>
            {[-0.42, 0.42].flatMap((x) =>
              [-0.7, 0.7].map((z) => (
                <mesh key={`${x}${z}`} position={[x, 1.1, z]} material={mat(PALETTE.wood)}>
                  <cylinderGeometry args={[0.03, 0.03, 1.3, 6]} />
                </mesh>
              )),
            )}
            <Box size={[1.05, 0.05, 1.8]} position={[0, 1.76, 0]} color={spec.canopy} />
          </group>
        )}
        {spec.loop && (
          <>
            {/* The boatman rows from the stern */}
            <Sitter z={-1.35} jacket="#e9e2d0" skin={SKIN[(index + 2) % SKIN.length]} />
            <group ref={oar} position={[0.45, 0.95, -1.15]}>
              <Box size={[0.05, 0.05, 2.3]} position={[0.25, -0.3, 0.2]} rotation={[0.3, 0.2, -0.6]} color={PALETTE.wood} />
            </group>
            {Array.from({ length: spec.passengers }, (_, i) => (
              <Sitter key={i} z={0.15 + i * 0.75} jacket={LIFE_JACKET} skin={i % 2 ? skin : SKIN[(index + 1) % SKIN.length]} face={-1} />
            ))}
          </>
        )}
      </group>
      {/* A faint V of wake spreading out behind the stern */}
      <mesh ref={wake} material={WAKE_MATERIAL} visible={false}>
        <circleGeometry args={[4, 4, Math.PI / 2 - 0.3, 0.6]} />
      </mesh>
    </>
  );
}

// Rowing loops, checked to stay 4 m off the shore, the island and the jetty,
// and 5 m apart from each other, so boats never meet.
const BOATS: BoatSpec[] = [
  { color: "#d62828", canopy: "#f2c230", passengers: 2, loop: { cx: -352, cz: -8, a: 22, b: 20, angle: 0, dir: 1, speed: 2.2 } },
  { color: "#1d4ed8", passengers: 1, loop: { cx: -352, cz: -8, a: 33, b: 30, angle: 2.5, dir: -1, speed: 2.6 } },
  { color: "#f2c230", canopy: "#d62828", passengers: 2, loop: { cx: -440, cz: 12, a: 22, b: 16, angle: 1, dir: 1, speed: 2.4 } },
  { color: "#16a34a", passengers: 2, loop: { cx: -412, cz: -42, a: 30, b: 24, angle: 4, dir: -1, speed: 2 } },
  { color: "#0ea5e9", canopy: "#ffffff", passengers: 1, loop: { cx: -329, cz: 50, a: 13, b: 22, angle: 3, dir: 1, speed: 1.8 } },
  { color: "#e11d48", passengers: 2, loop: { cx: -420, cz: 60, a: 24, b: 20, angle: 5, dir: 1, speed: 2.1 } },
  { color: "#7c3aed", canopy: "#f2c230", passengers: 1, loop: { cx: -382, cz: -82, a: 28, b: 13, angle: 0.5, dir: -1, speed: 2.3 } },
  { color: "#ea580c", passengers: 2, loop: { cx: -372, cz: 76, a: 22, b: 13, angle: 2, dir: -1, speed: 2 } },
  // Moored either side of the jetty
  { color: "#d62828", passengers: 0, at: { x: -305.4, z: 21.2, heading: -Math.PI / 2 } },
  { color: "#1d4ed8", passengers: 0, at: { x: -310.2, z: 21.2, heading: -Math.PI / 2 } },
  { color: "#16a34a", passengers: 0, at: { x: -305.8, z: 26.8, heading: -Math.PI / 2 } },
  { color: "#f2c230", passengers: 0, at: { x: -310.6, z: 26.8, heading: -Math.PI / 2 } },
  // ...and two at each landing round the lake
  ...PORTS.flatMap((p, i) =>
    [-2, 2].map((side, j): BoatSpec => ({
      color: ["#d62828", "#1d4ed8", "#16a34a", "#f2c230", "#7c3aed", "#ea580c"][(i * 2 + j) % 6],
      canopy: j ? "#f2c230" : undefined,
      passengers: 0,
      at: {
        x: p.at[0] + p.into[0] * PORT_JETTY * 0.55 + p.into[1] * side,
        z: p.at[1] + p.into[1] * PORT_JETTY * 0.55 - p.into[0] * side,
        heading: Math.atan2(p.into[0], p.into[1]),
      },
    })),
  ),
];

/**
 * A wooden jetty from the shore at `at`, reaching `length` out over the water
 * the way of `into`. Its deck clears the stone border along the shore.
 */
export function Jetty({ at, into, length }: { at: Vec2; into: Vec2; length: number }) {
  const piles = Math.max(2, Math.round(length / 3.3));
  return (
    <group position={[at[0] + (into[0] * length) / 2, 0, at[1] + (into[1] * length) / 2]} rotation-y={Math.atan2(into[0], into[1])}>
      <Box size={[2.6, 0.22, length]} position={[0, 0.56, 0]} color="#8a6a45" />
      {Array.from({ length: piles }, (_, i) =>
        [-1.15, 1.15].map((x) => (
          <mesh key={`${i}${x}`} position={[x, 0.2, -length / 2 + 1 + (i * (length - 2)) / (piles - 1)]} material={mat(PALETTE.wood)} castShadow>
            <cylinderGeometry args={[0.1, 0.1, 0.9, 6]} />
          </mesh>
        )),
      )}
    </group>
  );
}

/** Lakeside's jetty, where the boats are hired. It stops short of the nearest rowing loop. */
const LAKESIDE_JETTY = { at: [SHORE_X, 24] as Vec2, into: [-1, 0] as Vec2, length: 12 };

// ---------------------------------------------------------------------------
// The promenade: lamps and benches (its shade trees are with the lake's, in LakeLife)
// ---------------------------------------------------------------------------

function Promenade() {
  return (
    <>
      {LAKESIDE_LAMPS.map(([x, z]) => (
        <group key={z} position={[x, 0, z]}>
          <mesh position-y={1.6} material={mat("#2f3d33")} castShadow>
            <cylinderGeometry args={[0.07, 0.09, 3.2, 8]} />
          </mesh>
          <mesh position-y={3.3} material={mat("#fff1c1", 0.4)}>
            <sphereGeometry args={[0.2, 10, 8]} />
          </mesh>
        </group>
      ))}
      {/* Benches face the lake, backs to the promenade */}
      {LAKESIDE_BENCHES.map(([x, z]) => (
        <group key={z} position={[x, 0, z]} rotation-y={-Math.PI / 2}>
          <Box size={[1.8, 0.1, 0.5]} position={[0, BENCH_SEAT - 0.05, 0]} color="#8a6a45" />
          <Box size={[1.8, 0.45, 0.08]} position={[0, BENCH_SEAT + 0.3, -0.22]} color="#8a6a45" />
          {[-0.75, 0.75].map((bx) => (
            <Box key={bx} size={[0.08, BENCH_SEAT - 0.1, 0.45]} position={[bx, (BENCH_SEAT - 0.1) / 2, 0]} color="#3f3f46" />
          ))}
        </group>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// The cycle path round the lake, and the cyclists on it
// ---------------------------------------------------------------------------

const PATH_W = LAKE_PATH_HALF_WIDTH;
/** World units per repeat of the stone texture, as on the paving. */
const STONE_TILE = 6;

/**
 * The cycle path's surface: a flat strip either side of its centre line, with
 * the stone texture laid in world space. Along Lakeside the path is on the
 * paving already, so the strip leaves that stretch out.
 */
function trackGeometry() {
  const { points, normals } = LAKE_PATH;
  const n = points.length;
  const [ax0, ax1, az0, az1] = POKHARA_AREA;
  const onPaving = ([x, z]: Vec2) => x > ax0 && x < ax1 && z > az0 && z < az1;
  const positions: number[] = [];
  const at = (i: number, side: number) => {
    const [x, z] = points[i % n];
    const [nx, nz] = normals[i % n];
    return [x + nx * PATH_W * side, 0, z + nz * PATH_W * side];
  };
  // Each triangle wound to face up.
  const triangle = (a: number[], b: number[], c: number[]) => {
    const up = (b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2]) > 0;
    positions.push(...a, ...(up ? b : c), ...(up ? c : b));
  };
  for (let i = 0; i < n; i++) {
    if (onPaving(points[i]) && onPaving(points[(i + 1) % n])) continue;
    const [a, b, c, d] = [at(i, -1), at(i, 1), at(i + 1, -1), at(i + 1, 1)];
    triangle(a, b, c);
    triangle(b, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(positions.map((_, k) => (k % 3 === 1 ? 1 : 0)), 3));
  const uv: number[] = [];
  for (let k = 0; k < positions.length; k += 3) uv.push(positions[k] / STONE_TILE, -positions[k + 2] / STONE_TILE);
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  return g;
}

/** The cycle path: a stone-flagged track all the way round the lake. Click it to ride there. */
function CyclePath() {
  const geometry = useMemo(() => trackGeometry(), []);
  const material = useMemo(
    () =>
      // Drawn just over the fields (and where it meets Lakeside, the paving) without flickering.
      new THREE.MeshStandardMaterial({ map: getStoneTexture(), roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
    [],
  );
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 6) return; // the end of a drag
    driveToPoint(e.point.x, e.point.z);
  };
  return <mesh geometry={geometry} material={material} position-y={0.01} receiveShadow onClick={onClick} />;
}

// Riders keep left, as in Nepal, so each direction has its own lane. `s` is
// how far round the centre line, increasing in the order of LAKE_PATH's points.
// Going that way (+1), a rider's left is on this side of the centre line:
const [t0x, t0z] = LAKE_PATH.tangents[0];
const [n0x, n0z] = LAKE_PATH.normals[0];
const FORWARD_LANE = Math.sign(t0z * n0x - t0x * n0z) * LAKE_PATH_LANE;
/** How far towards the edge a rider pulls over to let the visitor by. */
const PULL_OVER = 1.25;

interface CyclistState {
  s: number;
  dir: 1 | -1;
  speed: number;
  cruise: number;
  travelled: number;
  /** How far they've pulled over (0 to PULL_OVER). */
  aside: number;
}
const RIDERS = 12;
const CYCLISTS: CyclistState[] = Array.from({ length: RIDERS }, (_, i) => {
  const dir = i % 2 ? -1 : 1;
  return {
    // Spread evenly round, the two directions staggered.
    s: ((Math.floor(i / 2) + (dir < 0 ? 0.5 : 0)) * LAKE_PATH.length) / (RIDERS / 2),
    dir,
    speed: 0,
    cruise: 3.4 + (i % 3) * 0.6,
    travelled: i * 3,
    aside: 0,
  };
});
const CRANK = 0.17;
const BB_Y = 0.38;
// Each rider's feet ride their own pedals round.
const PEDALS = CYCLISTS.map(() => [new THREE.Vector3(), new THREE.Vector3()]);
const FEET = CYCLISTS.map((c, i) =>
  [-1, 1].map((sx, f) => () => {
    const a = c.travelled / 0.9 + (sx < 0 ? Math.PI : 0);
    return PEDALS[i][f].set(sx * 0.13, BB_Y + Math.cos(a) * CRANK, Math.sin(a) * CRANK);
  }) as [() => THREE.Vector3, () => THREE.Vector3],
);
const CYCLIST_LOOKS = [
  { frame: "#e11d48", shirt: "#2a9d8f", helmet: "#f2c230" },
  { frame: "#2563eb", shirt: "#f4a261", helmet: "#ffffff" },
  { frame: "#16a34a", shirt: "#e9c46a", helmet: "#264653" },
  { frame: "#f59e0b", shirt: "#6d597a", helmet: "#e63946" },
  { frame: "#7c3aed", shirt: "#f1faee", helmet: "#2a9d8f" },
  { frame: "#0f766e", shirt: "#e76f51", helmet: "#f4f1ea" },
  { frame: "#be123c", shirt: "#457b9d", helmet: "#f2c230" },
];

function Cyclist({ index }: { index: number }) {
  const root = useRef<THREE.Group>(null!);
  const wheels = useRef<(THREE.Group | null)[]>([]);
  const crank = useRef<THREE.Group>(null!);
  const look = CYCLIST_LOOKS[index % CYCLIST_LOOKS.length];

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 30);
    const c = CYCLISTS[index];
    const { point, tangent, normal } = lakePathAt(c.s);
    const fx = tangent[0] * c.dir;
    const fz = tangent[1] * c.dir;
    const lane = FORWARD_LANE * c.dir;
    const offset = lane + Math.sign(lane) * c.aside;
    const x = point[0] + normal[0] * offset;
    const z = point[1] + normal[1] * offset;

    // The visitor: wait if they're in the way ahead; pull over towards the
    // edge when they come up behind, or to get past them where they've stopped.
    let clear = 99;
    const dx = car.x - x;
    const dz = car.z - z;
    const along = dx * fx + dz * fz;
    const across = Math.abs(dx * fz - dz * fx);
    if (along > 0 && across < 1.2) clear = along;
    const near = along > -9 && along < 5 && across < 2.8;
    c.aside += ((near ? PULL_OVER : 0) - c.aside) * Math.min(1, dt * 2.5);
    // Riders ahead in the same lane.
    for (const o of CYCLISTS) {
      if (o === c || o.dir !== c.dir) continue;
      const gap = ((((o.s - c.s) * c.dir) % LAKE_PATH.length) + LAKE_PATH.length) % LAKE_PATH.length;
      clear = Math.min(clear, gap);
    }
    const target = clear < 3.2 ? 0 : clear < 6 ? c.cruise * 0.5 : c.cruise;
    c.speed += Math.sign(target - c.speed) * Math.min(Math.abs(target - c.speed), 4 * dt);
    c.s += c.speed * dt * c.dir;
    c.travelled += c.speed * dt;

    root.current.position.set(x, 0, z);
    root.current.rotation.set(0, Math.atan2(fx, fz), 0);
    wheels.current.forEach((w) => {
      if (w) w.rotation.x = c.travelled / 0.36;
    });
    crank.current.rotation.x = c.travelled / 0.9;
  });

  const frame = look.frame;
  const seat: [number, number, number] = [0, 0.97, -0.16];
  const head: [number, number, number] = [0, 0.95, 0.44];
  const bb: [number, number, number] = [0, BB_Y, 0];
  return (
    <group ref={root}>
      {[0.58, -0.56].map((z, i) => (
        <group key={z} position={[0, 0.36, z]}>
          <group
            ref={(el) => {
              wheels.current[i] = el;
            }}
          >
            <mesh rotation-y={Math.PI / 2} material={mat("#22252b", 0.9)} castShadow>
              <torusGeometry args={[0.33, 0.035, 8, 24]} />
            </mesh>
            {[0, 1, 2].map((k) => (
              <mesh key={k} rotation-x={(k * Math.PI) / 3} material={mat("#c4cad2", 0.5)}>
                <boxGeometry args={[0.012, 0.62, 0.012]} />
              </mesh>
            ))}
          </group>
        </group>
      ))}
      <Tube from={bb} to={seat} color={frame} />
      <Tube from={seat} to={head} color={frame} />
      <Tube from={[0, 0.86, 0.46]} to={bb} radius={0.03} color={frame} />
      <Tube from={[0, BB_Y, 0]} to={[0, 0.36, -0.56]} radius={0.016} color={frame} />
      <Tube from={[0, 0.95, -0.15]} to={[0, 0.36, -0.56]} radius={0.016} color={frame} />
      <Tube from={[0, 0.95, 0.44]} to={[0, 0.36, 0.58]} radius={0.02} color={frame} />
      <Tube from={[-0.28, 1.08, 0.45]} to={[0.28, 1.08, 0.45]} radius={0.016} color="#8d96a3" />
      <Box size={[0.14, 0.05, 0.26]} position={[0, 1.03, -0.18]} color="#1f1f1f" />
      <group ref={crank} position={bb}>
        {[-1, 1].map((sx) => (
          <mesh key={sx} position={[sx * 0.1, sx * (CRANK / 2), 0]} material={mat("#8d96a3", 0.4, 0.5)}>
            <boxGeometry args={[0.02, CRANK, 0.03]} />
          </mesh>
        ))}
      </group>
      <Rider
        hips={[0, 1.12, -0.18]}
        shoulders={[0, 1.57, 0.12]}
        head={[0, 1.8, 0.2]}
        hands={[
          [-0.25, 1.08, 0.45],
          [0.25, 1.08, 0.45],
        ]}
        feet={FEET[index]}
        shirt={look.shirt}
        pants="#2b2d42"
        helmet={look.helmet}
      />
    </group>
  );
}

// ---------------------------------------------------------------------------
// Across the lake: the Peace Pagoda's hill, and paragliders over Sarangkot
// ---------------------------------------------------------------------------

/** Trees scattered over a dome-shaped hill (skipping its very top). */
function HillTrees({ center, radius, height, count, seed, clearTop = 0 }: { center: Vec2; radius: number; height: number; count: number; seed: number; clearTop?: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null!);
  useLayoutEffect(() => {
    const rand = seeded(seed);
    const o = new THREE.Object3D();
    const color = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const a = rand() * Math.PI * 2;
      const d = clearTop + (radius * 0.9 - clearTop) * Math.sqrt(rand());
      const y = height * Math.sqrt(Math.max(0, 1 - (d / radius) ** 2));
      o.position.set(center[0] + Math.cos(a) * d, y + 1.4, center[1] + Math.sin(a) * d);
      o.scale.setScalar(1.2 + rand() * 0.9);
      o.updateMatrix();
      mesh.current.setMatrixAt(i, o.matrix);
      mesh.current.setColorAt(i, color.set(PALETTE.foliage[i % PALETTE.foliage.length]).multiplyScalar(0.85));
    }
    mesh.current.instanceMatrix.needsUpdate = true;
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
  }, [center, radius, height, count, seed, clearTop]);
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} castShadow>
      <coneGeometry args={[1.3, 3.6, 7]} />
      <meshStandardMaterial roughness={0.9} flatShading />
    </instancedMesh>
  );
}

function Dome({ center, radius, height, color }: { center: Vec2; radius: number; height: number; color: string }) {
  return (
    <mesh position={[center[0], 0, center[1]]} scale={[radius, height, radius]} material={mat(color)} receiveShadow>
      <sphereGeometry args={[1, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
    </mesh>
  );
}

/** The World Peace Pagoda: a white stupa with a golden Buddha, on the hill south of the lake. */
function PeacePagoda() {
  const { center, height } = LAKE_HILLS.pagoda;
  const gold = mat(PALETTE.gold, 0.35, 0.6);
  return (
    <group position={[center[0], height - 0.6, center[1]]}>
      <mesh position-y={0.8} material={mat(WHITE)} castShadow receiveShadow>
        <cylinderGeometry args={[10, 10.6, 1.6, 32]} />
      </mesh>
      <mesh position-y={2.5} material={mat(WHITE)} castShadow receiveShadow>
        <cylinderGeometry args={[8, 8.4, 1.8, 32]} />
      </mesh>
      <mesh position-y={3.4} material={mat(WHITE, 0.7)} castShadow>
        <sphereGeometry args={[6.4, 32, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <Box size={[1.8, 1.2, 1.8]} position={[0, 10.2, 0]} color={WHITE} />
      <mesh position-y={12.4} material={gold} castShadow>
        <coneGeometry args={[0.8, 3.6, 16]} />
      </mesh>
      <Pinnacle y={14} scale={0.6} />
      {/* The golden Buddha looks out over the lake, to the north */}
      <group position={[0, 5.2, -6.3]}>
        <Box size={[2.4, 3, 0.6]} position={[0, 0, 0]} color="#d8cfbf" />
        <mesh position={[0, -0.4, -0.35]} material={gold} castShadow>
          <boxGeometry args={[1.3, 1.1, 0.4]} />
        </mesh>
        <mesh position={[0, 0.5, -0.35]} material={gold} castShadow>
          <sphereGeometry args={[0.4, 12, 10]} />
        </mesh>
      </group>
    </group>
  );
}

// Circles over the lake's north shore, coming down from Sarangkot: checked to
// stay 12 m above the hill and 9 m from each other.
const GLIDERS = [
  { cx: -380, cz: -112, r: 20, y: 58, speed: 0.16, color: "#e63946", phase: 0 },
  { cx: -404, cz: -96, r: 18, y: 46, speed: -0.2, color: "#f2c230", phase: 2 },
  { cx: -354, cz: -122, r: 16, y: 70, speed: 0.13, color: "#2a9d8f", phase: 4 },
  { cx: -424, cz: -76, r: 22, y: 35, speed: 0.11, color: "#3d5a80", phase: 1 },
  { cx: -366, cz: -80, r: 14, y: 30, speed: -0.17, color: "#f4a261", phase: 3 },
];

// Canopies are seen from below as much as above, so they're two-sided.
const canopies = new Map<string, THREE.MeshStandardMaterial>();
function canopyMaterial(color: string) {
  let m = canopies.get(color);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness: 0.7, side: THREE.DoubleSide });
    canopies.set(color, m);
  }
  return m;
}

function Paraglider({ index }: { index: number }) {
  const g = GLIDERS[index];
  const root = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => {
    const a = g.phase + clock.elapsedTime * g.speed;
    const dir = Math.sign(g.speed);
    root.current.position.set(g.cx + Math.cos(a) * g.r, g.y + Math.sin(clock.elapsedTime * 0.3 + g.phase) * 2, g.cz + Math.sin(a) * g.r);
    // Fly along the circle, banked into it (the centre is on the left going
    // anticlockwise, on the right going clockwise).
    root.current.rotation.set(0, Math.atan2(-Math.sin(a) * dir, Math.cos(a) * dir), dir * 0.22);
  });
  return (
    <group ref={root}>
      {/* The canopy: an arch spanning left to right, its chord fore and aft */}
      <mesh rotation-x={-Math.PI / 2} material={canopyMaterial(g.color)}>
        <cylinderGeometry args={[4, 4, 1.6, 14, 1, true, -1.05, 2.1]} />
      </mesh>
      {/* Lines from the wing tips down to the pilot, who hangs well below */}
      {[-1, 1].map((side) => (
        <Tube key={side} from={[side * 3.4, 2, 0]} to={[0, -3.2, 0]} radius={0.015} color="#e5e7eb" />
      ))}
      <Box size={[0.4, 0.6, 0.4]} position={[0, -3.5, 0]} color="#264653" />
    </group>
  );
}

// ---------------------------------------------------------------------------
// On the way: rice terraces, prayer flags and the gateway into Pokhara
// ---------------------------------------------------------------------------

function RiceTerraces() {
  const greens = ["#9cc95a", "#8bbd4f", "#a6cf63", "#93c457"];
  return (
    <>
      {TERRACES.map(([x0, x1, z0, z1], t) => {
        const south = z0 > 0;
        const steps = 6;
        const depth = (z1 - z0) / steps;
        return Array.from({ length: steps }, (_, k) => {
          // Rising away from the road.
          const h = 0.35 + k * 0.6;
          const z = south ? z0 + (k + 0.5) * depth : z1 - (k + 0.5) * depth;
          const edge = south ? z - depth / 2 + 0.18 : z + depth / 2 - 0.18;
          return (
            <group key={`${t}-${k}`}>
              <Box size={[x1 - x0 - k * 2, h, depth + 0.02]} position={[(x0 + x1) / 2, h / 2, z]} color={greens[(k + t) % greens.length]} />
              <Box size={[x1 - x0 - k * 2, 0.12, 0.36]} position={[(x0 + x1) / 2, h + 0.06, edge]} color="#8a6a3e" />
            </group>
          );
        });
      })}
    </>
  );
}

const FLAG_COLORS = ["#2f6fd1", "#f4f4f0", "#d23c3c", "#3f9a4a", "#f2c230"];
let flagMaterials: THREE.MeshStandardMaterial[] | null = null;
/** One two-sided material per flag colour, shared by every flag. */
function getFlagMaterials() {
  flagMaterials ??= FLAG_COLORS.map((color) => new THREE.MeshStandardMaterial({ color, roughness: 0.9, side: THREE.DoubleSide }));
  return flagMaterials;
}

/** A string of small prayer flags across the road at `x`, sagging between two tall poles. */
function RoadFlags({ x }: { x: number }) {
  const [z0, z1] = [ROAD2[2] - 2, ROAD2[3] + 2];
  const top = 7.4;
  const sag = 1.1;
  const count = 40;
  const materials = useMemo(() => getFlagMaterials(), []);
  const y = (t: number) => top - sag * 4 * t * (1 - t);
  return (
    <group>
      {[z0, z1].map((z) => (
        <mesh key={z} position={[x, top / 2, z]} material={mat(PALETTE.woodLight)} castShadow>
          <cylinderGeometry args={[0.07, 0.1, top, 6]} />
        </mesh>
      ))}
      {/* The cord, in short straight pieces */}
      {Array.from({ length: 8 }, (_, i) => (
        <Tube key={i} from={[x, y(i / 8), z0 + ((z1 - z0) * i) / 8]} to={[x, y((i + 1) / 8), z0 + ((z1 - z0) * (i + 1)) / 8]} radius={0.012} color="#d6d3cb" />
      ))}
      {Array.from({ length: count }, (_, i) => {
        const t = (i + 0.5) / count;
        return (
          <mesh key={i} position={[x, y(t) - 0.17, z0 + (z1 - z0) * t]} rotation-y={Math.PI / 2} material={materials[i % materials.length]}>
            <planeGeometry args={[0.26, 0.32]} />
          </mesh>
        );
      })}
    </group>
  );
}

/** A painted gateway over the road where it reaches Pokhara, with a tiled roof. */
function Gateway({ x }: { x: number }) {
  const [z0, z1] = [ROAD2[2] - 1.2, ROAD2[3] + 1.2];
  const zc = (z0 + z1) / 2;
  const span = z1 - z0;
  return (
    <group>
      {[z0, z1].map((z) => (
        <group key={z}>
          <Box size={[1.4, 0.6, 1.4]} position={[x, 0.3, z]} color={PALETTE.stone} />
          <Box size={[1, 6.4, 1]} position={[x, 3.2, z]} color={PALETTE.brick} />
        </group>
      ))}
      <Box size={[1.3, 0.9, span + 1.6]} position={[x, 6.85, zc]} color="#b5161f" />
      <Box size={[1.5, 0.2, span + 2]} position={[x, 7.4, zc]} color={PALETTE.gold} roughness={0.35} metalness={0.5} />
      <Box size={[2.8, 0.16, span + 2.8]} position={[x, 7.58, zc]} color={PALETTE.wood} />
      <RectFrustum bottom={[2.6, span + 2.6]} top={[0.4, span + 0.6]} height={1.3} position={[x, 8.3, zc]} color={PALETTE.tile} />
      {[-span / 3, 0, span / 3].map((dz) => (
        <group key={dz} position={[x, 0, zc + dz]}>
          <Pinnacle y={8.9} scale={dz === 0 ? 0.6 : 0.4} />
        </group>
      ))}
    </group>
  );
}

/** Trees lining both sides of the road to Pokhara. */
function RoadsideTrees() {
  const mesh = useRef<THREE.InstancedMesh>(null!);
  const spots = useMemo(() => {
    const list: Vec2[] = [];
    for (let x = -236; x <= -172; x += 8) {
      if (Math.abs(x + 205) < 4) continue; // the prayer flags
      list.push([x, ROAD2[2] - 2.2], [x + 4, ROAD2[3] + 2.2]);
    }
    return list;
  }, []);
  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    const color = new THREE.Color();
    spots.forEach(([x, z], i) => {
      o.position.set(x, 2.6, z);
      o.scale.setScalar(0.9 + (i % 3) * 0.12);
      o.updateMatrix();
      mesh.current.setMatrixAt(i, o.matrix);
      mesh.current.setColorAt(i, color.set(PALETTE.foliage[i % PALETTE.foliage.length]));
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
  }, [spots]);
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, spots.length]} castShadow>
      <coneGeometry args={[1.1, 3.4, 7]} />
      <meshStandardMaterial roughness={0.9} flatShading />
    </instancedMesh>
  );
}

/** Everything in and on the way to Pokhara. */
export default function Pokhara() {
  const { pagoda, sarangkot } = LAKE_HILLS;
  return (
    <>
      <Lake />
      <Jetty {...LAKESIDE_JETTY} />
      {PORTS.map((p, i) => (
        <Jetty key={i} at={p.at} into={p.into} length={PORT_JETTY} />
      ))}
      {BOATS.map((spec, i) => (
        <Boat key={i} spec={spec} index={i} />
      ))}
      <Promenade />
      <CyclePath />
      <LakeLife />
      {CYCLISTS.map((_, i) => (
        <Cyclist key={i} index={i} />
      ))}

      <Dome center={pagoda.center} radius={pagoda.radius} height={pagoda.height} color="#6f9150" />
      <HillTrees center={pagoda.center} radius={pagoda.radius} height={pagoda.height} count={46} seed={311} clearTop={16} />
      <PeacePagoda />
      <Dome center={sarangkot.center} radius={sarangkot.radius} height={sarangkot.height} color="#6a8c4c" />
      <HillTrees center={sarangkot.center} radius={sarangkot.radius} height={sarangkot.height} count={70} seed={523} clearTop={10} />
      {GLIDERS.map((_, i) => (
        <Paraglider key={i} index={i} />
      ))}

      <RiceTerraces />
      <RoadsideTrees />
      <RoadFlags x={-205} />
      <Gateway x={-238} />
    </>
  );
}
