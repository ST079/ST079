"use client";

import { useMemo, type ReactNode } from "react";
import * as THREE from "three";

/** The town's palette: soft, matte, daylight colours. */
export const PALETTE = {
  sky: "#e9eef3",
  grass: "#b9d79f",
  lawn: "#b0d293",
  asphalt: "#5f6672",
  marking: "#f4f6f8",
  sidewalk: "#e6e1d6",
  cream: "#f6f1e7",
  stone: "#ddd6c8",
  white: "#fbfbf8",
  glass: "#a9c9dd",
  wood: "#7a5232",
  dark: "#2f3542",
  hedge: "#6a9f58",
  foliage: ["#73a86a", "#86b86b", "#5f9b5c", "#9cc173"],
  trunk: "#8b6b4a",
} as const;

const cache = new Map<string, THREE.MeshStandardMaterial>();

/** A shared matte material per colour, so hundreds of meshes reuse a handful. */
export function mat(color: string, roughness = 0.85, flatShading = false) {
  const key = `${color}|${roughness}|${flatShading}`;
  let material = cache.get(key);
  if (!material) {
    material = new THREE.MeshStandardMaterial({ color, roughness, metalness: 0, flatShading });
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
  children,
}: {
  size: V3;
  position: V3;
  color: string;
  rotation?: V3;
  roughness?: number;
  children?: ReactNode;
}) {
  return (
    <mesh position={position} rotation={rotation} material={mat(color, roughness)} castShadow receiveShadow>
      <boxGeometry args={size} />
      {children}
    </mesh>
  );
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
    <mesh
      geometry={geometry}
      position={position}
      rotation={rotation}
      material={mat(color)}
      castShadow
      receiveShadow
    />
  );
}
