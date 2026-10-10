"use client";

import type { ComponentType } from "react";
import { RoundedBox } from "@react-three/drei";

import type { VehicleId } from "../store";
import { mat, PALETTE } from "./parts";

// The cars you can pick in the garage. Each is a body (local +z forward,
// ground at y = 0) plus where its wheels go; <Car> spins and steers the wheels.

export interface WheelSpec {
  x: number;
  z: number;
  radius: number;
  /** Front wheels turn with the steering. */
  front: boolean;
}

export interface VehicleSpec {
  id: VehicleId;
  name: string;
  /** Swatch colour for the garage menu. */
  color: string;
  wheels: WheelSpec[];
  Body: ComponentType;
}

const GLASS = "#3a4a5c";

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

export const VEHICLES: VehicleSpec[] = [
  {
    id: "hatchback",
    name: "Hatchback",
    color: "#e63946",
    Body: Hatchback,
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
    wheels: [
      { x: 0, z: 1.45, radius: 0.32, front: true },
      { x: 0.74, z: -1.1, radius: 0.34, front: false },
      { x: -0.74, z: -1.1, radius: 0.34, front: false },
    ],
  },
];

export const vehicleById = Object.fromEntries(VEHICLES.map((v) => [v.id, v])) as Record<VehicleId, VehicleSpec>;
