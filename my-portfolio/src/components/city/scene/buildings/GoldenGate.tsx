"use client";

import { Box, mat, PALETTE, RectFrustum } from "../parts";
import { Pinnacle } from "./pagoda";

/**
 * Education: the Golden Gate (Sun Dhoka), a gilded doorway with a
 * semicircular torana, set into the red brick palace wall.
 */
export default function GoldenGate() {
  const gold = mat(PALETTE.gold, 0.35, 0.6);

  return (
    <group>
      {/* Wall */}
      <Box size={[14.1, 0.5, 4.1]} position={[0, 0.25, -0.5]} color={PALETTE.plaster} />
      <Box size={[14, 7, 4]} position={[0, 3.75, -0.5]} color={PALETTE.brick} />
      <RectFrustum bottom={[14.8, 5]} top={[13.6, 1.2]} height={1.4} position={[0, 7.95, -0.5]} color={PALETTE.tile} />
      {[-4.6, 4.6].map((x) => (
        <group key={x}>
          <Box size={[1.6, 1.8, 0.1]} position={[x, 4.6, 1.52]} color={PALETTE.woodLight} />
          <Box size={[1.3, 1.5, 0.12]} position={[x, 4.6, 1.54]} color={PALETTE.wood} />
        </group>
      ))}

      {/* The gate: dark doorway, gilded pillars, lintel and torana */}
      <Box size={[2.6, 3.4, 0.1]} position={[0, 1.95, 1.55]} color="#1f140d" />
      {[-1.5, 1.5].map((x) => (
        <mesh key={x} position={[x, 2.15, 1.62]} material={gold} castShadow>
          <boxGeometry args={[0.4, 3.8, 0.28]} />
        </mesh>
      ))}
      <mesh position={[0, 4.15, 1.62]} material={gold} castShadow>
        <boxGeometry args={[3.6, 0.42, 0.3]} />
      </mesh>
      <mesh position={[0, 4.35, 1.66]} rotation-x={Math.PI / 2} material={gold} castShadow>
        <cylinderGeometry args={[1.9, 1.9, 0.26, 32, 1, false, Math.PI / 2, Math.PI]} />
      </mesh>
      <mesh position={[0, 5.1, 1.8]} material={mat("#b8861b", 0.4, 0.5)}>
        <sphereGeometry args={[0.38, 14, 10]} />
      </mesh>

      {/* Small gilded roof over the gate */}
      <RectFrustum bottom={[4.4, 1.8]} top={[1.2, 0.3]} height={0.9} position={[0, 6.75, 1.9]} color="#b8861b" />
      <Pinnacle y={7.2} scale={0.55} />
    </group>
  );
}
