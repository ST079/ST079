"use client";

import { Box, Frustum, mat, PALETTE, RectFrustum } from "../parts";

interface TiersProps {
  /** Height where the first roof starts (top of the sanctum walls). */
  y: number;
  /** Wall width of the first tier; each tier above shrinks by `shrink`. */
  wall: number;
  count: number;
  shrink?: number;
  overhang?: number;
  roofHeight?: number;
  /** Wall height between roofs. */
  gap?: number;
  /** Width/depth ratio for rectangular pagodas (1 = square). */
  aspect?: number;
}

/**
 * Newari pagoda roofs: wide, low tiled tiers with a dark carved eave under
 * each, stacked over shrinking wooden walls, topped with a gilded pinnacle.
 */
export function PagodaTiers({
  y,
  wall,
  count,
  shrink = 0.75,
  overhang = 2.6,
  roofHeight = 1.5,
  gap = 1.3,
  aspect = 1,
}: TiersProps) {
  const tiers = [];
  let base = y;
  for (let k = 0; k < count; k++) {
    const w = wall - k * shrink;
    const last = k === count - 1;
    const bottom = w + overhang;
    const top = last ? 0.5 : w * 0.45;
    tiers.push(
      <group key={k}>
        {aspect === 1 ? (
          <>
            <Box size={[bottom + 0.1, 0.18, bottom + 0.1]} position={[0, base + 0.05, 0]} color={PALETTE.wood} />
            <Frustum bottom={bottom} top={top} height={roofHeight} position={[0, base + roofHeight / 2, 0]} color={PALETTE.tile} />
          </>
        ) : (
          <>
            <Box size={[bottom + 0.1, 0.18, bottom * aspect + 0.1]} position={[0, base + 0.05, 0]} color={PALETTE.wood} />
            <RectFrustum
              bottom={[bottom, bottom * aspect]}
              top={last ? [top * 3, 0.3] : [top, top * aspect]}
              height={roofHeight}
              position={[0, base + roofHeight / 2, 0]}
              color={PALETTE.tile}
            />
          </>
        )}
        {!last && (
          <Box
            size={[w - shrink, gap, (w - shrink) * aspect]}
            position={[0, base + roofHeight * 0.5 + gap / 2, 0]}
            color={PALETTE.woodLight}
          />
        )}
      </group>,
    );
    base += roofHeight * 0.5 + gap;
  }

  // Gilded pinnacle (gajur) on the top roof.
  const peak = base - gap + roofHeight * 0.5;
  return (
    <group>
      {tiers}
      <Pinnacle y={peak} />
    </group>
  );
}

export function Pinnacle({ y, scale = 1 }: { y: number; scale?: number }) {
  const gold = mat(PALETTE.gold, 0.35, 0.6);
  return (
    <group position-y={y} scale={scale}>
      <mesh position-y={0.35} material={gold} castShadow>
        <cylinderGeometry args={[0.18, 0.5, 0.7, 12]} />
      </mesh>
      <mesh position-y={0.85} material={gold} castShadow>
        <sphereGeometry args={[0.3, 12, 10]} />
      </mesh>
      <mesh position-y={1.45} material={gold} castShadow>
        <coneGeometry args={[0.14, 0.9, 10]} />
      </mesh>
    </group>
  );
}

/** A small stone guardian figure (lion, elephant, wrestler...) for temple stairs. */
export function Guardian({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <Box size={[0.5, 0.25, 0.7]} position={[0, 0.125, 0]} color={PALETTE.stoneDark} />
      <Box size={[0.36, 0.55, 0.5]} position={[0, 0.52, 0]} color={PALETTE.stone} />
      <mesh position={[0, 0.95, 0.08]} material={mat(PALETTE.stone)} castShadow>
        <sphereGeometry args={[0.2, 10, 8]} />
      </mesh>
    </group>
  );
}
