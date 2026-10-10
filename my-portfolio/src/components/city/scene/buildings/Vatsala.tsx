"use client";

import { Box, Frustum, mat, PALETTE } from "../parts";
import { Guardian, Pinnacle } from "./pagoda";

const STONE = "#cdbfa5";
// Plinth levels as [size, height, centre y].
const PLINTH: [number, number, number][] = [
  [8, 1, 0.5],
  [6.8, 1, 1.5],
  [5.8, 0.8, 2.4],
];
const TOP = 2.8;

/**
 * Skills: Vatsala Durga, a stone shikhara temple: stepped plinth, a sanctum
 * with four small corner spires and a tall curving main spire.
 */
export default function Vatsala() {
  return (
    <group>
      {PLINTH.map(([size, h, y]) => (
        <Box key={size} size={[size, h, size]} position={[0, y, 0]} color={STONE} />
      ))}

      {/* Steps from the top level (z 2.9) down to the ground (z 5.6), guarded by two stone lions */}
      {Array.from({ length: 4 }, (_, i) => (
        <Box
          key={i}
          size={[2, TOP - i * 0.7, 0.675]}
          position={[0, (TOP - i * 0.7) / 2, 2.9 + (i + 0.5) * 0.675]}
          color={PALETTE.stoneDark}
        />
      ))}
      {[-1.35, 1.35].map((x) => (
        <Guardian key={x} position={[x, 1, 3.7]} scale={1.1} />
      ))}

      {/* Sanctum */}
      <Box size={[4.4, 2.6, 4.4]} position={[0, TOP + 1.3, 0]} color={STONE} />
      <Box size={[1.2, 1.9, 0.12]} position={[0, TOP + 0.95, 2.22]} color={PALETTE.wood} />

      {/* Corner spires */}
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <group key={`${sx}${sz}`} position={[sx * 2.35, TOP + 2.6, sz * 2.35]}>
            <Frustum bottom={1.1} top={0.25} height={2.2} position={[0, 1.1, 0]} color={STONE} />
            <Pinnacle y={2.2} scale={0.4} />
          </group>
        )),
      )}

      {/* Main spire with horizontal bands, crowned by a disc and gold finial */}
      <Frustum bottom={4} top={1.1} height={7.6} position={[0, TOP + 2.6 + 3.8, 0]} color={STONE} />
      {[1.6, 3.4, 5.2].map((h) => {
        const w = 4 - (h / 7.6) * 2.9 + 0.15;
        return <Box key={h} size={[w, 0.16, w]} position={[0, TOP + 2.6 + h, 0]} color={PALETTE.stoneDark} />;
      })}
      <mesh position-y={TOP + 2.6 + 7.85} material={mat(STONE)} castShadow>
        <cylinderGeometry args={[0.85, 0.85, 0.45, 14]} />
      </mesh>
      <Pinnacle y={TOP + 2.6 + 8.05} scale={0.8} />
    </group>
  );
}
