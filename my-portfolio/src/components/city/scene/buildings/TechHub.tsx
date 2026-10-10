"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { Box, PALETTE } from "../parts";

const SAND = "#f2cc8f";

/** Skills: a glass ground floor under a cantilevered upper floor, with a satellite dish on top. */
export default function TechHub() {
  const dish = useRef<THREE.Group>(null!);

  useFrame((state) => {
    dish.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.4) * 1.2;
  });

  return (
    <group>
      <Box size={[6.4, 2.8, 6]} position={[0, 1.4, -0.4]} color={PALETTE.glass} roughness={0.35} />
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <Box key={`${sx}${sz}`} size={[0.25, 2.8, 0.25]} position={[sx * 3.1, 1.4, -0.4 + sz * 2.9]} color={PALETTE.white} />
        )),
      )}
      <Box size={[1.4, 2.2, 0.1]} position={[0, 1.1, 2.62]} color={PALETTE.dark} />

      <Box size={[7.6, 2.8, 7.2]} position={[0, 4.2, -0.2]} color={SAND} />
      <Box size={[7.66, 0.9, 7.26]} position={[0, 4.3, -0.2]} color={PALETTE.glass} roughness={0.35} />
      <Box size={[7.8, 0.25, 7.4]} position={[0, 5.72, -0.2]} color={PALETTE.white} />

      {/* Satellite dish */}
      <group ref={dish} position={[1.8, 5.85, -1.6]}>
        <mesh position-y={0.45} castShadow>
          <cylinderGeometry args={[0.12, 0.16, 0.9, 8]} />
          <meshStandardMaterial color="#cbd5e1" />
        </mesh>
        <mesh position={[0, 1.15, 0.2]} rotation-x={-0.9} castShadow>
          <sphereGeometry args={[1.05, 24, 10, 0, Math.PI * 2, 0, 0.95]} />
          <meshStandardMaterial color={PALETTE.white} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}
