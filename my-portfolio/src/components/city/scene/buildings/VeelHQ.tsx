"use client";

import { Box, PALETTE } from "../parts";

const TOWER = "#3d5a80";
const FLOORS = 8;

/** Experience: a slate-blue office tower on a podium, with floor bands and a rooftop antenna. */
export default function VeelHQ() {
  return (
    <group>
      <Box size={[7.6, 1.4, 7.6]} position={[0, 0.7, 0]} color="#e3e7ee" />
      <Box size={[6, 13.5, 6]} position={[0, 8.15, -0.4]} color={TOWER} roughness={0.55} />
      {Array.from({ length: FLOORS }, (_, i) => (
        <Box key={i} size={[6.1, 0.14, 6.1]} position={[0, 2.9 + i * 1.5, -0.4]} color="#eef2f7" />
      ))}

      {/* Roof */}
      <Box size={[4.2, 1, 4.2]} position={[0, 15.4, -0.4]} color="#2b3f5c" />
      <mesh position={[1.2, 17, 0.6]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 2.4, 6]} />
        <meshStandardMaterial color="#cbd5e1" />
      </mesh>
      <mesh position={[1.2, 18.25, 0.6]}>
        <sphereGeometry args={[0.13, 10, 10]} />
        <meshStandardMaterial color="#e63946" />
      </mesh>

      {/* Entrance */}
      <Box size={[3.2, 1.1, 0.1]} position={[0, 0.6, 3.82]} color={PALETTE.glass} roughness={0.4} />
      <Box size={[4.4, 0.12, 1.4]} position={[0, 1.5, 4.25]} color={PALETTE.white} />
    </group>
  );
}
