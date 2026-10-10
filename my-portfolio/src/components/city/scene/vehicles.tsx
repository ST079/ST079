"use client";

import { useMemo, useRef, type ComponentType } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";

import { car, type VehicleId } from "../store";
import { mat, PALETTE } from "./parts";

// The rides you can pick in the garage: four cars and two two-wheelers. Each
// is a body (local +z forward, ground at y = 0) plus where its wheels go;
// <Car> spins and steers the wheels, and leans the two-wheelers into turns.

export interface WheelSpec {
  x: number;
  z: number;
  radius: number;
  /** Front wheels turn with the steering. */
  front: boolean;
  /** Tyre width (default 0.28). */
  width?: number;
  /** A thin bicycle wheel with spokes, rather than a solid one. */
  spoked?: boolean;
}

export interface VehicleSpec {
  id: VehicleId;
  name: string;
  /** Swatch colour for the garage menu. */
  color: string;
  wheels: WheelSpec[];
  Body: ComponentType;
  /** Fork and handlebar, turned with the front wheel. */
  Fork?: ComponentType;
  /** Distance between the axles: shorter turns tighter. */
  wheelbase: number;
  maxSpeed: number;
  /** Size for bumping into things. */
  radius: number;
  /** Leans into turns. */
  twoWheeler?: boolean;
  /** Chase camera distance, relative to a car's. */
  chase?: number;
}

const GLASS = "#3a4a5c";
type V3 = [number, number, number];

// ---------------------------------------------------------------------------
// Bits for the two-wheelers: tubes, and a rider whose legs can follow pedals
// ---------------------------------------------------------------------------

const UP = new THREE.Vector3(0, 1, 0);
const along = new THREE.Vector3();

/** Stretch a unit-height, Y-aligned mesh so it runs from `a` to `b`. */
function spanBetween(mesh: THREE.Object3D, a: THREE.Vector3, b: THREE.Vector3) {
  along.subVectors(b, a);
  const length = along.length() || 1e-3;
  mesh.position.addVectors(a, b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(UP, along.divideScalar(length));
  mesh.scale.set(1, length, 1);
}

/** A round tube between two points (frames, forks, arms). */
function Tube({ from, to, radius = 0.025, color, roughness = 0.5 }: { from: V3; to: V3; radius?: number; color: string; roughness?: number }) {
  const { position, quaternion, length } = useMemo(() => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const dir = new THREE.Vector3().subVectors(b, a);
    const length = dir.length();
    return {
      position: a.add(b).multiplyScalar(0.5),
      quaternion: new THREE.Quaternion().setFromUnitVectors(UP, dir.normalize()),
      length,
    };
  }, [from, to]);
  return (
    <mesh position={position} quaternion={quaternion} material={mat(color, roughness)} castShadow>
      <cylinderGeometry args={[radius, radius, length, 10]} />
    </mesh>
  );
}

/**
 * A leg from hip to foot, bending forwards at the knee. `foot` is asked for
 * every frame, so a cyclist's feet can ride the pedals round.
 */
function Leg({ hip, foot, length = 0.47, color }: { hip: V3; foot: () => THREE.Vector3; length?: number; color: string }) {
  const thigh = useRef<THREE.Mesh>(null!);
  const shin = useRef<THREE.Mesh>(null!);
  const v = useRef({ hip: new THREE.Vector3(), knee: new THREE.Vector3(), dir: new THREE.Vector3(), out: new THREE.Vector3() });

  useFrame(() => {
    const { hip: h, knee, dir, out } = v.current;
    h.set(...hip);
    const f = foot();
    dir.subVectors(f, h);
    const reach = Math.min(dir.length(), length * 2 - 1e-3);
    dir.normalize();
    // The knee sits off the hip-to-foot line, in the leg's own (y, z) plane, towards the front.
    out.set(0, -dir.z, dir.y).normalize();
    if (out.z < 0) out.negate();
    const half = reach / 2;
    knee.copy(h).addScaledVector(dir, half).addScaledVector(out, Math.sqrt(Math.max(length * length - half * half, 0)));
    spanBetween(thigh.current, h, knee);
    spanBetween(shin.current, knee, f);
  });

  return (
    <>
      <mesh ref={thigh} material={mat(color)} castShadow>
        <cylinderGeometry args={[0.06, 0.055, 1, 8]} />
      </mesh>
      <mesh ref={shin} material={mat(color)} castShadow>
        <cylinderGeometry args={[0.05, 0.045, 1, 8]} />
      </mesh>
    </>
  );
}

interface RiderProps {
  hips: V3;
  shoulders: V3;
  head: V3;
  /** Left and right hands. */
  hands: [V3, V3];
  /** Left and right feet. */
  feet: [() => THREE.Vector3, () => THREE.Vector3];
  shirt: string;
  pants: string;
  helmet: string;
  /** A motorcyclist's full-face helmet rather than a cycling one. */
  fullFace?: boolean;
  legLength?: number;
}

function Rider({ hips, shoulders, head, hands, feet, shirt, pants, helmet, fullFace, legLength }: RiderProps) {
  return (
    <group>
      <Tube from={hips} to={shoulders} radius={0.14} color={shirt} roughness={0.9} />
      <mesh position={head} material={mat("#c68642")} castShadow>
        <sphereGeometry args={[0.12, 12, 10]} />
      </mesh>
      <mesh position={[head[0], head[1] + (fullFace ? 0 : 0.035), head[2]]} material={mat(helmet, 0.35)} castShadow>
        <sphereGeometry args={fullFace ? [0.165, 16, 12] : [0.14, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      {fullFace && (
        <mesh position={[head[0], head[1] + 0.01, head[2] + 0.12]} material={mat("#1b2430", 0.2)}>
          <boxGeometry args={[0.2, 0.08, 0.08]} />
        </mesh>
      )}
      {([-1, 1] as const).map((sx, i) => (
        <Tube
          key={sx}
          from={[sx * 0.17, shoulders[1] - 0.04, shoulders[2]]}
          to={hands[i]}
          radius={0.045}
          color={shirt}
          roughness={0.9}
        />
      ))}
      {([-1, 1] as const).map((sx, i) => (
        <Leg key={sx} hip={[sx * 0.1, hips[1], hips[2]]} foot={feet[i]} length={legLength} color={pants} />
      ))}
    </group>
  );
}

/** Feet that stay put, for a motorcyclist on the footpegs. */
function fixedFoot(x: number, y: number, z: number) {
  const point = new THREE.Vector3(x, y, z);
  return () => point;
}

function Lights({ z, y, x = 0.55, front = "#fff6d5", back = "#b3202c" }: { z: number; y: number; x?: number; front?: string; back?: string }) {
  return (
    <>
      {[-x, x].map((px) => (
        <group key={px}>
          <mesh position={[px, y, z]} material={mat(front, 0.3)}>
            <boxGeometry args={[0.36, 0.15, 0.05]} />
          </mesh>
          <mesh position={[px, y, -z]} material={mat(back, 0.4)}>
            <boxGeometry args={[0.36, 0.14, 0.05]} />
          </mesh>
        </group>
      ))}
    </>
  );
}

function Hatchback() {
  return (
    <>
      <RoundedBox args={[1.8, 0.6, 3.6]} radius={0.2} smoothness={3} position-y={0.66} castShadow material={mat("#e63946", 0.5)} />
      <mesh position-y={0.4} material={mat(PALETTE.dark)}>
        <boxGeometry args={[1.82, 0.16, 3.3]} />
      </mesh>
      <RoundedBox args={[1.5, 0.55, 1.85]} radius={0.16} smoothness={3} position={[0, 1.18, -0.25]} castShadow material={mat(GLASS, 0.35)} />
      <RoundedBox args={[1.54, 0.1, 1.7]} radius={0.05} smoothness={2} position={[0, 1.46, -0.25]} castShadow material={mat(PALETTE.white, 0.5)} />
      <Lights z={1.79} y={0.72} />
    </>
  );
}

function Taxi() {
  const yellow = "#f2c230";
  return (
    <>
      <RoundedBox args={[1.72, 0.62, 3.5]} radius={0.14} smoothness={3} position-y={0.66} castShadow material={mat(yellow, 0.5)} />
      <mesh position-y={0.4} material={mat(PALETTE.dark)}>
        <boxGeometry args={[1.74, 0.16, 3.2]} />
      </mesh>
      <mesh position-y={0.82} material={mat("#1f2328")}>
        <boxGeometry args={[1.745, 0.08, 3.3]} />
      </mesh>
      <RoundedBox args={[1.48, 0.58, 1.9]} radius={0.12} smoothness={3} position={[0, 1.2, -0.15]} castShadow material={mat(GLASS, 0.35)} />
      <RoundedBox args={[1.5, 0.08, 1.75]} radius={0.04} smoothness={2} position={[0, 1.5, -0.15]} castShadow material={mat(yellow, 0.5)} />
      {/* Roof sign */}
      <mesh position={[0, 1.66, -0.15]} material={mat(PALETTE.white, 0.5)} castShadow>
        <boxGeometry args={[0.72, 0.24, 0.32]} />
      </mesh>
      <mesh position={[0, 1.66, -0.15]} material={mat("#1f2328")}>
        <boxGeometry args={[0.74, 0.07, 0.34]} />
      </mesh>
      <Lights z={1.74} y={0.72} x={0.52} />
    </>
  );
}

function Jeep() {
  const olive = "#5a6e3a";
  return (
    <>
      <mesh position-y={0.9} material={mat(olive, 0.6)} castShadow>
        <boxGeometry args={[1.95, 0.75, 3.8]} />
      </mesh>
      <mesh position-y={0.55} material={mat(PALETTE.dark)}>
        <boxGeometry args={[1.97, 0.12, 3.6]} />
      </mesh>
      {/* Cabin with glass, under a canvas top */}
      <mesh position={[0, 1.62, -0.45]} material={mat(GLASS, 0.35)} castShadow>
        <boxGeometry args={[1.82, 0.72, 2.1]} />
      </mesh>
      <mesh position={[0, 2.03, -0.45]} material={mat("#c9b38a", 0.9)} castShadow>
        <boxGeometry args={[1.9, 0.12, 2.25]} />
      </mesh>
      {/* Grille, bumpers and the spare wheel on the back */}
      <mesh position={[0, 0.95, 1.91]} material={mat(PALETTE.dark)}>
        <boxGeometry args={[1.2, 0.4, 0.04]} />
      </mesh>
      {[1.95, -1.95].map((z) => (
        <mesh key={z} position={[0, 0.6, z]} material={mat("#8d96a3", 0.5)}>
          <boxGeometry args={[1.9, 0.16, 0.14]} />
        </mesh>
      ))}
      <mesh position={[0, 1.15, -2.05]} rotation-x={Math.PI / 2} material={mat("#22252b", 0.9)} castShadow>
        <cylinderGeometry args={[0.42, 0.42, 0.25, 16]} />
      </mesh>
      {[-0.65, 0.65].map((x) => (
        <mesh key={x} position={[x, 1.02, 1.92]} rotation-x={Math.PI / 2} material={mat("#fff6d5", 0.3)}>
          <cylinderGeometry args={[0.13, 0.13, 0.05, 12]} />
        </mesh>
      ))}
    </>
  );
}

/** The Safa tempo: Kathmandu's green-and-white electric three-wheeler. */
function Tempo() {
  const green = "#2e8b57";
  const white = "#f1f1ec";
  return (
    <>
      {/* Passenger box */}
      <mesh position={[0, 0.72, -0.55]} material={mat(green, 0.6)} castShadow>
        <boxGeometry args={[1.52, 0.55, 2.22]} />
      </mesh>
      <mesh position={[0, 1.3, -0.55]} material={mat(white, 0.6)} castShadow>
        <boxGeometry args={[1.5, 0.75, 2.2]} />
      </mesh>
      <mesh position={[0, 1.38, -0.4]} material={mat(GLASS, 0.35)}>
        <boxGeometry args={[1.53, 0.4, 1.6]} />
      </mesh>
      <mesh position={[0, 1.74, -0.55]} material={mat(white, 0.6)} castShadow>
        <boxGeometry args={[1.58, 0.1, 2.32]} />
      </mesh>
      {/* Driver's cab */}
      <mesh position={[0, 1.05, 1.02]} material={mat(green, 0.6)} castShadow>
        <boxGeometry args={[1.25, 1.2, 0.95]} />
      </mesh>
      <mesh position={[0, 1.4, 1.5]} material={mat(GLASS, 0.35)}>
        <boxGeometry args={[1.1, 0.5, 0.05]} />
      </mesh>
      <mesh position={[0, 1.7, 1.02]} material={mat(white, 0.6)} castShadow>
        <boxGeometry args={[1.3, 0.1, 1]} />
      </mesh>
      <mesh position={[0, 0.62, 1.55]} material={mat(green, 0.6)}>
        <boxGeometry args={[0.42, 0.14, 0.6]} />
      </mesh>
      <mesh position={[0, 0.95, 1.52]} rotation-x={Math.PI / 2} material={mat("#fff6d5", 0.3)}>
        <cylinderGeometry args={[0.12, 0.12, 0.05, 12]} />
      </mesh>
    </>
  );
}

// ---------------------------------------------------------------------------
// Motorbike: a classic single, the valley's favourite way to get around
// ---------------------------------------------------------------------------

const BIKE_RED = "#b5161f";
const CHROME = "#c9ced6";
const MOTO = { front: 0.72, rear: -0.66, radius: 0.34 };

/** The motorcyclist's feet, on the footpegs. */
const PEG_FEET: [() => THREE.Vector3, () => THREE.Vector3] = [fixedFoot(-0.21, 0.4, -0.08), fixedFoot(0.21, 0.4, -0.08)];

function Motorbike() {
  return (
    <>
      {/* Engine, frame, tank and seat */}
      <mesh position={[0, 0.48, 0]} material={mat("#3a3f47", 0.6, 0.3)} castShadow>
        <boxGeometry args={[0.32, 0.34, 0.52]} />
      </mesh>
      <Tube from={[0, 0.56, MOTO.rear + 0.05]} to={[0, 0.92, 0.5]} radius={0.035} color="#2b2d33" />
      <RoundedBox args={[0.38, 0.26, 0.56]} radius={0.1} smoothness={3} position={[0, 0.9, 0.2]} castShadow material={mat(BIKE_RED, 0.35, 0.2)} />
      <RoundedBox args={[0.32, 0.1, 0.62]} radius={0.04} smoothness={2} position={[0, 0.86, -0.33]} castShadow material={mat("#1f1f1f", 0.8)} />
      {/* Rear mudguard and tail light */}
      <mesh position={[0, 0.76, MOTO.rear - 0.02]} material={mat(BIKE_RED, 0.35, 0.2)} castShadow>
        <boxGeometry args={[0.2, 0.05, 0.5]} />
      </mesh>
      <mesh position={[0, 0.8, MOTO.rear - 0.28]} material={mat("#b3202c", 0.4)}>
        <boxGeometry args={[0.14, 0.06, 0.04]} />
      </mesh>
      {/* Exhaust along the right side */}
      <Tube from={[0.17, 0.33, 0.18]} to={[0.19, 0.44, -0.88]} radius={0.05} color={CHROME} roughness={0.25} />
      <Rider
        hips={[0, 1.02, -0.34]}
        shoulders={[0, 1.5, -0.06]}
        head={[0, 1.74, 0.02]}
        hands={[
          [-0.3, 1.08, MOTO.front - 0.24],
          [0.3, 1.08, MOTO.front - 0.24],
        ]}
        feet={PEG_FEET}
        legLength={0.42}
        shirt="#3d405b"
        pants="#2b2d42"
        helmet="#264653"
        fullFace
      />
    </>
  );
}

/** The motorbike's front fork, headlight and handlebar (relative to the front axle). */
function MotorbikeFork() {
  return (
    <>
      {[-0.09, 0.09].map((x) => (
        <Tube key={x} from={[x, 0, 0]} to={[x * 0.9, 0.62, -0.2]} radius={0.03} color={CHROME} roughness={0.25} />
      ))}
      <mesh position={[0, 0.38, 0.02]} material={mat(BIKE_RED, 0.35, 0.2)} castShadow>
        <boxGeometry args={[0.16, 0.04, 0.42]} />
      </mesh>
      <mesh position={[0, 0.62, -0.1]} rotation-x={Math.PI / 2} material={mat(CHROME, 0.25, 0.6)} castShadow>
        <cylinderGeometry args={[0.11, 0.1, 0.14, 16]} />
      </mesh>
      <mesh position={[0, 0.62, -0.025]} rotation-x={Math.PI / 2} material={mat("#fff6d5", 0.3)}>
        <cylinderGeometry args={[0.085, 0.085, 0.02, 16]} />
      </mesh>
      <Tube from={[-0.33, 0.74, -0.24]} to={[0.33, 0.74, -0.24]} radius={0.02} color="#2b2d33" />
      {[-0.3, 0.3].map((x) => (
        <Tube key={x} from={[x - 0.05, 0.74, -0.24]} to={[x + 0.05, 0.74, -0.24]} radius={0.032} color="#1f1f1f" roughness={0.9} />
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Bicycle: pedalled along, legs and all
// ---------------------------------------------------------------------------

const CYCLE = { front: 0.58, rear: -0.56, radius: 0.36 };
/** Bottom bracket: where the cranks turn. */
const BB = new THREE.Vector3(0, 0.38, 0);
const CRANK = 0.17;
/** Radians of crank per metre ridden (about 85 rpm at full speed). */
const CADENCE = 1 / 0.9;

/** The cyclist's feet, riding the pedals round: right pedal at angle a, left half a turn behind. */
const PEDALS = [new THREE.Vector3(), new THREE.Vector3()];
const PEDAL_FEET = [-1, 1].map((sx, i) => () => {
  const a = car.travelled * CADENCE + (sx < 0 ? Math.PI : 0);
  return PEDALS[i].set(sx * 0.13, BB.y + Math.cos(a) * CRANK, BB.z + Math.sin(a) * CRANK);
}) as [() => THREE.Vector3, () => THREE.Vector3];

function Bicycle() {
  const frame = "#1d7a8c";
  const crank = useRef<THREE.Group>(null!);

  useFrame(() => {
    crank.current.rotation.x = car.travelled * CADENCE;
  });

  const seat: V3 = [0, 0.97, -0.16];
  const head: V3 = [0, 0.95, 0.44];
  const bb: V3 = [BB.x, BB.y, BB.z];
  return (
    <>
      {/* Diamond frame */}
      <Tube from={bb} to={seat} color={frame} />
      <Tube from={seat} to={head} color={frame} />
      <Tube from={[0, 0.86, 0.46]} to={bb} radius={0.03} color={frame} />
      <Tube from={[0, 0.84, 0.47]} to={[0, 1.0, 0.43]} radius={0.032} color={frame} />
      {[-0.05, 0.05].map((x) => (
        <group key={x}>
          <Tube from={[x, BB.y, BB.z]} to={[x, CYCLE.radius, CYCLE.rear]} radius={0.016} color={frame} />
          <Tube from={[x, seat[1] - 0.02, seat[2]]} to={[x, CYCLE.radius, CYCLE.rear]} radius={0.016} color={frame} />
        </group>
      ))}
      {/* Saddle */}
      <mesh position={[0, 1.03, -0.18]} material={mat("#1f1f1f", 0.8)} castShadow>
        <boxGeometry args={[0.14, 0.05, 0.26]} />
      </mesh>
      {/* Chainring and cranks, turning with the pedalling */}
      <mesh position={[0.07, BB.y, BB.z]} rotation-y={Math.PI / 2} material={mat("#8d96a3", 0.4, 0.5)}>
        <torusGeometry args={[0.1, 0.012, 6, 24]} />
      </mesh>
      <group ref={crank} position={[BB.x, BB.y, BB.z]}>
        {[-1, 1].map((sx) => (
          <group key={sx}>
            <mesh position={[sx * 0.1, (sx > 0 ? 1 : -1) * (CRANK / 2), 0]} material={mat("#8d96a3", 0.4, 0.5)}>
              <boxGeometry args={[0.02, CRANK, 0.03]} />
            </mesh>
            <mesh position={[sx * 0.14, (sx > 0 ? 1 : -1) * CRANK, 0]} material={mat("#2b2d33")}>
              <boxGeometry args={[0.09, 0.02, 0.06]} />
            </mesh>
          </group>
        ))}
      </group>
      <Rider
        hips={[0, 1.12, -0.18]}
        shoulders={[0, 1.57, 0.12]}
        head={[0, 1.8, 0.2]}
        hands={[
          [-0.25, 1.08, CYCLE.front - 0.13],
          [0.25, 1.08, CYCLE.front - 0.13],
        ]}
        feet={PEDAL_FEET}
        shirt="#f4a261"
        pants="#264653"
        helmet="#e63946"
      />
    </>
  );
}

/** The bicycle's fork and handlebar (relative to the front axle). */
function BicycleFork() {
  const frame = "#1d7a8c";
  return (
    <>
      {[-0.04, 0.04].map((x) => (
        <Tube key={x} from={[x, 0, 0]} to={[x * 0.75, 0.48, -0.11]} radius={0.016} color={frame} />
      ))}
      <Tube from={[0, 0.46, -0.11]} to={[0, 0.72, -0.13]} radius={0.02} color="#8d96a3" />
      <Tube from={[-0.28, 0.72, -0.13]} to={[0.28, 0.72, -0.13]} radius={0.016} color="#8d96a3" />
      {[-0.25, 0.25].map((x) => (
        <Tube key={x} from={[x - 0.04, 0.72, -0.13]} to={[x + 0.04, 0.72, -0.13]} radius={0.024} color="#1f1f1f" roughness={0.9} />
      ))}
    </>
  );
}

const CAR = { wheelbase: 2.3, maxSpeed: 16, radius: 1.5 };

export const VEHICLES: VehicleSpec[] = [
  {
    id: "hatchback",
    name: "Hatchback",
    color: "#e63946",
    Body: Hatchback,
    ...CAR,
    wheels: [
      { x: 0.86, z: 1.15, radius: 0.38, front: true },
      { x: -0.86, z: 1.15, radius: 0.38, front: true },
      { x: 0.86, z: -1.15, radius: 0.38, front: false },
      { x: -0.86, z: -1.15, radius: 0.38, front: false },
    ],
  },
  {
    id: "taxi",
    name: "Taxi",
    color: "#f2c230",
    Body: Taxi,
    ...CAR,
    wheels: [
      { x: 0.82, z: 1.1, radius: 0.36, front: true },
      { x: -0.82, z: 1.1, radius: 0.36, front: true },
      { x: 0.82, z: -1.1, radius: 0.36, front: false },
      { x: -0.82, z: -1.1, radius: 0.36, front: false },
    ],
  },
  {
    id: "jeep",
    name: "Jeep",
    color: "#5a6e3a",
    Body: Jeep,
    ...CAR,
    wheels: [
      { x: 0.95, z: 1.25, radius: 0.46, front: true },
      { x: -0.95, z: 1.25, radius: 0.46, front: true },
      { x: 0.95, z: -1.25, radius: 0.46, front: false },
      { x: -0.95, z: -1.25, radius: 0.46, front: false },
    ],
  },
  {
    id: "tempo",
    name: "Safa tempo",
    color: "#2e8b57",
    Body: Tempo,
    ...CAR,
    wheels: [
      { x: 0, z: 1.45, radius: 0.32, front: true },
      { x: 0.74, z: -1.1, radius: 0.34, front: false },
      { x: -0.74, z: -1.1, radius: 0.34, front: false },
    ],
  },
  {
    id: "motorbike",
    name: "Motorbike",
    color: BIKE_RED,
    Body: Motorbike,
    Fork: MotorbikeFork,
    wheelbase: MOTO.front - MOTO.rear,
    maxSpeed: 19,
    radius: 0.9,
    twoWheeler: true,
    chase: 0.8,
    wheels: [
      { x: 0, z: MOTO.front, radius: MOTO.radius, front: true, width: 0.15 },
      { x: 0, z: MOTO.rear, radius: MOTO.radius, front: false, width: 0.17 },
    ],
  },
  {
    id: "bicycle",
    name: "Bicycle",
    color: "#1d7a8c",
    Body: Bicycle,
    Fork: BicycleFork,
    wheelbase: CYCLE.front - CYCLE.rear,
    maxSpeed: 9,
    radius: 0.8,
    twoWheeler: true,
    chase: 0.7,
    wheels: [
      { x: 0, z: CYCLE.front, radius: CYCLE.radius, front: true, spoked: true },
      { x: 0, z: CYCLE.rear, radius: CYCLE.radius, front: false, spoked: true },
    ],
  },
];

export const vehicleById = Object.fromEntries(VEHICLES.map((v) => [v.id, v])) as Record<VehicleId, VehicleSpec>;
