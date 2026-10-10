"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { Box, PALETTE, Prism } from "../parts";

const ROOF = "#e07a5f";
const PUFFS = 4;

/** About: a cosy house with a garden hedge, a mailbox and a smoking chimney. */
export default function Home() {
  const puffs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    puffs.current.forEach((puff, i) => {
      if (!puff) return;
      const p = (t * 0.35 + i / PUFFS) % 1;
      puff.position.set(2.2 + p * 0.6, 5.2 + p * 2.4, -1.2 - p * 0.3);
      puff.scale.setScalar(0.25 + p * 0.45);
      (puff.material as THREE.MeshStandardMaterial).opacity = 0.75 * (1 - p);
    });
  });

  return (
    <group>
      <Box size={[8, 0.35, 6.2]} position={[0, 0.175, -0.4]} color={PALETTE.stone} />
      <Box size={[7.4, 2.9, 5.6]} position={[0, 1.8, -0.4]} color={PALETTE.cream} />
      <Prism width={6.4} height={2.1} depth={8.2} position={[0, 3.25, -0.4]} rotation={[0, Math.PI / 2, 0]} color={ROOF} />
      <Box size={[0.6, 1.6, 0.6]} position={[2.2, 4.4, -1.2]} color="#b5654f" />

      {/* Door, windows and frames */}
      <Box size={[1, 1.9, 0.1]} position={[-1.6, 1.3, 2.36]} color={PALETTE.wood} />
      <Box size={[1.45, 1.2, 0.06]} position={[1.5, 2.05, 2.33]} color={PALETTE.white} />
      <Box size={[1.2, 0.95, 0.08]} position={[1.5, 2.05, 2.36]} color={PALETTE.glass} roughness={0.4} />
      <Box size={[0.08, 0.95, 1.2]} position={[3.73, 2.05, -0.4]} color={PALETTE.glass} roughness={0.4} />

      {/* Garden path, hedge and mailbox */}
      <Box size={[1.2, 0.05, 1.5]} position={[-1.6, 0.03, 3.15]} color={PALETTE.stone} />
      <Box size={[2.3, 0.7, 0.6]} position={[-3.4, 0.35, 3.6]} color={PALETTE.hedge} />
      <Box size={[4.9, 0.7, 0.6]} position={[1.85, 0.35, 3.6]} color={PALETTE.hedge} />
      <Box size={[0.12, 0.9, 0.12]} position={[-0.55, 0.45, 3.1]} color={PALETTE.dark} />
      <Box size={[0.42, 0.32, 0.56]} position={[-0.55, 1.02, 3.1]} color={ROOF} />

      {Array.from({ length: PUFFS }, (_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            puffs.current[i] = el;
          }}
        >
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#f1f3f5" roughness={1} transparent depthWrite={false} flatShading />
        </mesh>
      ))}
    </group>
  );
}
