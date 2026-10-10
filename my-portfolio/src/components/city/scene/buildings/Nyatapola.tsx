"use client";

import { Box, PALETTE } from "../parts";
import { Guardian, PagodaTiers } from "./pagoda";

const LEVELS = [13, 11.4, 9.8, 8.2, 6.6];
const STEP = 1.15;
const TOP = LEVELS.length * STEP;
const STAIRS = 10;

/**
 * Projects: Nyatapola, the five-tiered pagoda of Taumadhi Square, on its
 * five-level plinth. A central staircase (local +z) is lined with pairs of
 * guardians, one pair per level.
 */
export default function Nyatapola() {
  return (
    <group>
      {LEVELS.map((size, i) => (
        <group key={size}>
          <Box size={[size, STEP, size]} position={[0, STEP * (i + 0.5), 0]} color={i % 2 ? "#94503a" : "#8a4733"} />
          <Box size={[size + 0.08, 0.14, size + 0.08]} position={[0, STEP * (i + 1) - 0.07, 0]} color={PALETTE.stone} />
        </group>
      ))}

      {/* Staircase climbing the front of the plinth, from the ground (z 9.7) to the top level (z 3.3) */}
      {Array.from({ length: STAIRS }, (_, i) => {
        const y = (i + 1) * (TOP / STAIRS);
        const depth = (9.7 - LEVELS[LEVELS.length - 1] / 2) / STAIRS;
        return <Box key={i} size={[2.6, y, depth]} position={[0, y / 2, 9.7 - (i + 0.5) * depth]} color={PALETTE.stone} />;
      })}
      {/* Guardian pairs on each level, beside the stairs */}
      {LEVELS.map((size, i) => (
        <group key={size}>
          {[-1.75, 1.75].map((x) => (
            <Guardian key={x} position={[x, STEP * (i + 1), size / 2 - 0.45]} scale={1 - i * 0.08} />
          ))}
        </group>
      ))}

      {/* Sanctum with doors on all four sides */}
      <Box size={[5, 2.6, 5]} position={[0, TOP + 1.3, 0]} color={PALETTE.brick} />
      {[0, Math.PI / 2, Math.PI, -Math.PI / 2].map((r) => (
        <group key={r} rotation-y={r}>
          <Box size={[1.3, 1.9, 0.12]} position={[0, TOP + 1.1, 2.52]} color={PALETTE.wood} />
          <Box size={[1.6, 0.2, 0.14]} position={[0, TOP + 2.15, 2.53]} color={PALETTE.gold} roughness={0.35} metalness={0.6} />
        </group>
      ))}

      <PagodaTiers y={TOP + 2.6} wall={5} count={5} shrink={0.7} overhang={2.6} roofHeight={1.5} gap={1.2} />
    </group>
  );
}
