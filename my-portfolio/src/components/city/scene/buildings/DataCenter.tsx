"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { Box, PALETTE } from "../parts";

const TEAL = "#2a9d8f";
const DEEP = "#264653";
const FANS = [-2.8, 0, 2.8];

/** Projects: a low data-centre hall with a server-rack facade and spinning rooftop fans. */
export default function DataCenter() {
  const blades = useRef<(THREE.Group | null)[]>([]);

  useFrame((_, dt) => {
    blades.current.forEach((blade, i) => {
      if (blade) blade.rotation.y += dt * (3 + i * 0.6);
    });
  });

  return (
    <group>
      <Box size={[9, 4.2, 7.2]} position={[0, 2.1, -0.4]} color="#e5e9ee" />
      <Box size={[9.1, 0.3, 7.3]} position={[0, 4.35, -0.4]} color="#cfd6dc" />

      {/* Server-rack stripes on the front */}
      {Array.from({ length: 7 }, (_, i) => (
        <Box
          key={i}
          size={[0.55, 3.1, 0.1]}
          position={[(i - 3) * 1.15 - 0.6, 2, 3.25]}
          color={i % 2 ? DEEP : TEAL}
        />
      ))}
      <Box size={[1.4, 2.3, 0.12]} position={[3.6, 1.15, 3.26]} color={PALETTE.dark} />

      {/* Cooling fans on the roof */}
      {FANS.map((x, i) => (
        <group key={x} position={[x, 4.75, -0.6]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.85, 0.85, 0.45, 20]} />
            <meshStandardMaterial color="#d1d9e0" />
          </mesh>
          <group
            ref={(el) => {
              blades.current[i] = el;
            }}
            position-y={0.25}
          >
            <Box size={[1.4, 0.05, 0.22]} position={[0, 0, 0]} color={PALETTE.dark} />
            <Box size={[0.22, 0.05, 1.4]} position={[0, 0, 0]} color={PALETTE.dark} />
          </group>
        </group>
      ))}
    </group>
  );
}
