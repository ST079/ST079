"use client";

import { Box, PALETTE } from "../parts";

const RED = "#d64545";

/** Contact: a small post office with a red band, a radio mast and a mailbox out front. */
export default function PostOffice() {
  return (
    <group>
      <Box size={[8.4, 3.4, 6]} position={[0, 1.7, -0.4]} color={PALETTE.cream} />
      <Box size={[8.6, 0.6, 6.2]} position={[0, 3.7, -0.4]} color={RED} />

      <Box size={[1.4, 2.2, 0.1]} position={[0, 1.1, 2.62]} color={PALETTE.wood} />
      <Box size={[3.4, 0.55, 0.1]} position={[0, 2.75, 2.64]} color={RED} />
      {[-2.6, 2.6].map((x) => (
        <Box key={x} size={[1.6, 1.1, 0.08]} position={[x, 1.85, 2.62]} color={PALETTE.glass} roughness={0.4} />
      ))}

      {/* Radio mast */}
      <mesh position={[-2.8, 5.4, -1.8]} castShadow>
        <cylinderGeometry args={[0.07, 0.1, 3, 6]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
      <Box size={[1.2, 0.06, 0.06]} position={[-2.8, 5.8, -1.8]} color="#94a3b8" />
      <Box size={[0.8, 0.06, 0.06]} position={[-2.8, 6.4, -1.8]} color="#94a3b8" />

      {/* Mailbox */}
      <Box size={[0.75, 1.05, 0.6]} position={[3.4, 0.53, 3.05]} color={RED} />
      <mesh position={[3.4, 1.05, 3.05]} rotation-z={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.75, 14, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color={RED} />
      </mesh>
      <Box size={[0.4, 0.06, 0.02]} position={[3.4, 0.8, 3.36]} color={PALETTE.dark} />
    </group>
  );
}
