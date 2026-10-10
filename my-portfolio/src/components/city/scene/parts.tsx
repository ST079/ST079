"use client";

import { useMemo, type ReactNode } from "react";
import * as THREE from "three";

/** Bhaktapur in daylight: red brick, dark carved wood, tiled roofs, stone and a little gold. */
export const PALETTE = {
  skyTop: "#8fbde4",
  haze: "#efe6d6",
  field: "#a3b974",
  brick: "#9c4630",
  brickDark: "#7f3524",
  wood: "#3e2618",
  woodLight: "#5b3a25",
  tile: "#5e3426",
  stone: "#c9bda6",
  stoneDark: "#a99d86",
  plaster: "#efe7d8",
  gold: "#d4a52a",
  bronze: "#a8803c",
  white: "#fbfbf8",
  glass: "#9fb6c4",
  dark: "#2f3542",
  foliage: ["#6f9a55", "#7da85e", "#5f8c4c", "#8db36a"],
  trunk: "#7a5a3c",
} as const;

const cache = new Map<string, THREE.MeshStandardMaterial>();

/** A shared matte material per colour, so hundreds of meshes reuse a handful. */
export function mat(color: string, roughness = 0.85, metalness = 0) {
  const key = `${color}|${roughness}|${metalness}`;
  let material = cache.get(key);
  if (!material) {
    material = new THREE.MeshStandardMaterial({ color, roughness, metalness });
    cache.set(key, material);
  }
  return material;
}

type V3 = [number, number, number];

/** A box that casts and receives shadows. */
export function Box({
  size,
  position,
  color,
  rotation,
  roughness,
  metalness,
  children,
}: {
  size: V3;
  position: V3;
  color: string;
  rotation?: V3;
  roughness?: number;
  metalness?: number;
  children?: ReactNode;
}) {
  return (
    <mesh
      position={position}
      rotation={rotation}
      material={mat(color, roughness, metalness)}
      castShadow
      receiveShadow
    >
      <boxGeometry args={size} />
      {children}
    </mesh>
  );
}

/**
 * A square frustum (pagoda roof tier, plinth step), or with `sides` an
 * octagonal one etc. `bottom` and `top` are side lengths for squares and
 * diameters otherwise.
 */
export function Frustum({
  bottom,
  top,
  height,
  position,
  color,
  sides = 4,
  roughness,
  metalness,
}: {
  bottom: number;
  top: number;
  height: number;
  position: V3;
  color: string;
  sides?: number;
  roughness?: number;
  metalness?: number;
}) {
  // For a square, the cylinder's radius is half the diagonal.
  const k = sides === 4 ? Math.SQRT1_2 : 0.5;
  return (
    <mesh
      position={position}
      rotation-y={sides === 4 ? Math.PI / 4 : 0}
      material={mat(color, roughness, metalness)}
      castShadow
      receiveShadow
    >
      <cylinderGeometry args={[top * k, bottom * k, height, sides]} />
    </mesh>
  );
}

/** A rectangular frustum (for rectangular pagoda roofs), sizes as [x, z]. */
export function RectFrustum({
  bottom,
  top,
  height,
  position,
  color,
}: {
  bottom: [number, number];
  top: [number, number];
  height: number;
  position: V3;
  color: string;
}) {
  const geometry = useMemo(() => {
    const [bx, bz] = [bottom[0] / 2, bottom[1] / 2];
    const [tx, tz] = [top[0] / 2, top[1] / 2];
    const h = height / 2;
    // 8 corners: bottom (y = -h) then top (y = +h)
    const v = [
      [-bx, -h, -bz], [bx, -h, -bz], [bx, -h, bz], [-bx, -h, bz],
      [-tx, h, -tz], [tx, h, -tz], [tx, h, tz], [-tx, h, tz],
    ];
    const faces = [
      [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7], // sides
      [4, 5, 6, 7], // top
      [3, 2, 1, 0], // bottom
    ];
    const positions: number[] = [];
    for (const [a, b, c, d] of faces) {
      for (const i of [a, c, b, a, d, c]) positions.push(...v[i]);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    g.computeVertexNormals();
    return g;
  }, [bottom, top, height]);

  return <mesh geometry={geometry} position={position} material={mat(color)} castShadow receiveShadow />;
}

/**
 * A triangular prism (gable roof or pediment): a triangle of `width` x `height`
 * in the local XY plane, extruded `depth` along Z, with its base at y = 0.
 */
export function Prism({
  width,
  height,
  depth,
  position,
  rotation,
  color,
}: {
  width: number;
  height: number;
  depth: number;
  position: V3;
  rotation?: V3;
  color: string;
}) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-width / 2, 0);
    shape.lineTo(width / 2, 0);
    shape.lineTo(0, height);
    shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
    g.translate(0, 0, -depth / 2);
    return g;
  }, [width, height, depth]);

  return (
    <mesh geometry={geometry} position={position} rotation={rotation} material={mat(color)} castShadow receiveShadow />
  );
}
