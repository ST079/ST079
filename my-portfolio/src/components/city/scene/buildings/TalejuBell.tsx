"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { cityStore } from "../../store";
import { Box, mat, PALETTE, RectFrustum } from "../parts";
import { Pinnacle } from "./pagoda";

/**
 * Contact: the Taleju Bell, hung between two stone pillars under a small
 * tiled roof. It sways gently, and swings when you park beside it.
 */
export default function TalejuBell() {
  const bell = useRef<THREE.Group>(null!);
  const swing = useRef({ amount: 0.04 });

  // Bell silhouette, rotated around the vertical axis.
  const geometry = useMemo(() => {
    const profile = [
      [0.02, 0],
      [0.18, -0.05],
      [0.42, -0.25],
      [0.55, -0.6],
      [0.62, -1.05],
      [0.82, -1.45],
      [0.86, -1.55],
      [0.7, -1.52],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.LatheGeometry(profile, 32);
  }, []);

  useFrame((state, dt) => {
    const ringing = cityStore.get().active === "contact";
    swing.current.amount = THREE.MathUtils.damp(swing.current.amount, ringing ? 0.32 : 0.04, 2, dt);
    bell.current.rotation.x = Math.sin(state.clock.elapsedTime * (ringing ? 3.2 : 1.3)) * swing.current.amount;
  });

  return (
    <group>
      <Box size={[3.6, 0.6, 3.6]} position={[0, 0.3, 0]} color={PALETTE.stone} />
      {[-1.3, 1.3].map((x) => (
        <Box key={x} size={[0.45, 4.4, 0.45]} position={[x, 2.8, 0]} color={PALETTE.stoneDark} />
      ))}
      <Box size={[3.3, 0.4, 0.6]} position={[0, 5.1, 0]} color={PALETTE.wood} />
      <RectFrustum bottom={[4.2, 2]} top={[1.4, 0.3]} height={1} position={[0, 5.8, 0]} color={PALETTE.tile} />
      <Pinnacle y={6.2} scale={0.5} />

      <group ref={bell} position-y={4.9}>
        <mesh geometry={geometry} castShadow>
          <meshStandardMaterial color={PALETTE.bronze} roughness={0.35} metalness={0.6} side={THREE.DoubleSide} />
        </mesh>
        <mesh position-y={-1.4} material={mat(PALETTE.dark)}>
          <sphereGeometry args={[0.16, 10, 8]} />
        </mesh>
      </group>
    </group>
  );
}
