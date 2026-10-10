"use client";

import { Box, mat, PALETTE, Prism } from "../parts";

const MARIGOLD = "#f2a22c";

/**
 * About: a four-storey Newari house. Carved wooden windows get grander towards
 * the top (lattice "tikijhyal", then a wide "gajhya" balcony window), and a
 * marigold garland hangs over the door.
 */
export default function NewaHome() {
  const garland = Array.from({ length: 13 }, (_, i) => {
    const t = i / 12; // 0..1
    const x = -0.95 + t * 1.9;
    const sag = 0.35 * Math.sin(Math.PI * t);
    return [x, 2.75 - sag, 3.92] as [number, number, number];
  });

  return (
    <group>
      <Box size={[8.2, 0.4, 7.7]} position={[0, 0.2, 0]} color={PALETTE.brickDark} />
      <Box size={[8, 10.4, 7.5]} position={[0, 5.6, 0]} color="#a34d35" />
      {[3, 5.6, 8.2].map((y) => (
        <Box key={y} size={[8.12, 0.18, 7.62]} position={[0, y, 0]} color={PALETTE.wood} />
      ))}

      {/* Ground floor: door with a carved frame, two small windows */}
      <Box size={[1.7, 2.6, 0.1]} position={[0, 1.65, 3.78]} color={PALETTE.woodLight} />
      <Box size={[1.2, 2.1, 0.12]} position={[0, 1.45, 3.8]} color={PALETTE.wood} />
      {[-2.6, 2.6].map((x) => (
        <Box key={x} size={[0.9, 0.9, 0.12]} position={[x, 1.9, 3.8]} color={PALETTE.wood} />
      ))}

      {/* First floor: the lattice window */}
      <Box size={[2.6, 2, 0.12]} position={[0, 4.3, 3.78]} color={PALETTE.woodLight} />
      <Box size={[2.2, 1.6, 0.25]} position={[0, 4.3, 3.84]} color={PALETTE.wood} />
      {[-2.7, 2.7].map((x) => (
        <Box key={x} size={[0.9, 1.2, 0.12]} position={[x, 4.3, 3.8]} color={PALETTE.wood} />
      ))}

      {/* Second floor: three windows */}
      {[-2.4, 0, 2.4].map((x) => (
        <group key={x}>
          <Box size={[1.3, 1.6, 0.1]} position={[x, 6.9, 3.78]} color={PALETTE.woodLight} />
          <Box size={[1, 1.3, 0.12]} position={[x, 6.9, 3.8]} color={PALETTE.wood} />
        </group>
      ))}

      {/* Top floor: the wide balcony window */}
      <Box size={[5, 1.5, 0.55]} position={[0, 9.45, 3.95]} color={PALETTE.woodLight} />
      <Box size={[4.6, 1.1, 0.6]} position={[0, 9.45, 3.98]} color={PALETTE.wood} />

      {/* Roof: ridge parallel to the front, dark eaves */}
      <Box size={[8.9, 0.2, 8.5]} position={[0, 10.75, 0]} color={PALETTE.wood} />
      <Prism width={9.2} height={2.5} depth={9} position={[0, 10.8, 0]} rotation={[0, Math.PI / 2, 0]} color={PALETTE.tile} />

      {/* Marigold garland */}
      {garland.map((p, i) => (
        <mesh key={i} position={p} material={mat(i % 3 === 1 ? "#e85d2a" : MARIGOLD, 0.7)}>
          <sphereGeometry args={[0.11, 8, 6]} />
        </mesh>
      ))}
    </group>
  );
}
