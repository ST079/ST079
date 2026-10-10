"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { Box, PALETTE, Prism } from "../parts";

const COLUMNS = [-5, -3, -1, 1, 3, 5];

/** Education: a columned hall with a pediment, a dome and a waving flag. */
export default function University() {
  const flag = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    flag.current.rotation.y = Math.sin(state.clock.elapsedTime * 2.2) * 0.25;
  });

  return (
    <group>
      <Box size={[15.6, 0.5, 7.4]} position={[0, 0.25, -0.6]} color={PALETTE.stone} />
      <Box size={[11, 0.25, 1.4]} position={[0, 0.125, 3.6]} color={PALETTE.stone} />
      <Box size={[14, 4.6, 5.6]} position={[0, 2.8, -0.9]} color="#f4f1de" />
      <Box size={[14.2, 0.4, 5.8]} position={[0, 5.3, -0.9]} color="#e7e1cf" />

      {/* Portico */}
      {COLUMNS.map((x) => (
        <mesh key={x} position={[x, 2.6, 2.4]} castShadow receiveShadow>
          <cylinderGeometry args={[0.32, 0.36, 4.2, 14]} />
          <meshStandardMaterial color={PALETTE.white} roughness={0.8} />
        </mesh>
      ))}
      <Box size={[11.8, 0.55, 2.4]} position={[0, 4.98, 2.2]} color={PALETTE.white} />
      <Prism width={11.8} height={1.5} depth={2.4} position={[0, 5.25, 2.2]} color={PALETTE.white} />

      {/* Dome */}
      <mesh position={[0, 6, -1]} castShadow>
        <cylinderGeometry args={[1.8, 1.8, 1, 24]} />
        <meshStandardMaterial color="#f4f1de" />
      </mesh>
      <mesh position={[0, 6.5, -1]} castShadow>
        <sphereGeometry args={[1.85, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#7fa7b8" roughness={0.6} />
      </mesh>

      {/* Flag */}
      <mesh position={[5.6, 6.6, -2.4]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 2.4, 6]} />
        <meshStandardMaterial color="#cbd5e1" />
      </mesh>
      <mesh ref={flag} position={[5.6, 7.35, -2.4]}>
        <boxGeometry args={[0.04, 0.6, 1]} />
        <meshStandardMaterial color="#7c6fd6" />
      </mesh>
    </group>
  );
}
