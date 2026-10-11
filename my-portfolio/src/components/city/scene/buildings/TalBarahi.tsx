"use client";

import { ISLAND } from "../../layout";
import { Box, Frustum, mat, PALETTE } from "../parts";
import { PagodaTiers } from "./pagoda";

const TREES: [number, number][] = [
  [-5, -4],
  [-5.5, 3.5],
  [4.2, -5],
  [-3.8, -5.6],
  [5, 2.4],
];

/**
 * Contact: Tal Barahi, the two-tiered pagoda on its wooded island in Phewa
 * Lake, with a landing for the boats in front (front faces +z).
 */
export default function TalBarahi() {
  const r = ISLAND.radius;
  return (
    <group>
      <Frustum sides={16} bottom={r * 2} top={r * 2 - 3} height={1.4} position={[0, 0.7, 0]} color="#7a9a55" />
      <Box size={[5.4, 0.6, 5.4]} position={[0, 1.7, 0]} color={PALETTE.stone} />
      <Box size={[3.2, 2.2, 3.2]} position={[0, 3.1, 0]} color={PALETTE.brick} />
      <Box size={[1, 1.5, 0.1]} position={[0, 2.75, 1.62]} color={PALETTE.wood} />
      <PagodaTiers y={4.2} wall={3.2} count={2} shrink={0.8} overhang={2} roofHeight={1.2} gap={1.1} />
      {TREES.map(([x, z], i) => (
        <group key={i} position={[x, 1.4, z]}>
          <mesh position-y={0.8} material={mat(PALETTE.trunk)} castShadow>
            <cylinderGeometry args={[0.15, 0.2, 1.6, 6]} />
          </mesh>
          <mesh position-y={2.4} material={mat(PALETTE.foliage[i % PALETTE.foliage.length])} castShadow>
            <icosahedronGeometry args={[1.3, 0]} />
          </mesh>
        </group>
      ))}
      {/* Steps down to the landing stage, where the boats tie up */}
      <Box size={[2, 0.3, 1.2]} position={[0, 1.25, r - 3.2]} color={PALETTE.stoneDark} />
      <Box size={[1.6, 0.18, 3.2]} position={[0, 0.45, r + 0.6]} color="#8a6a45" />
    </group>
  );
}
