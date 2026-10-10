"use client";

import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";

import { Box, mat, PALETTE, Prism } from "../parts";

const WINDOWS = 55;
const WIDTH = 30;

/** The row of 55 carved windows along the top-floor gallery. */
function GalleryWindows() {
  const mesh = useRef<THREE.InstancedMesh>(null!);

  useLayoutEffect(() => {
    const object = new THREE.Object3D();
    const step = (WIDTH - 1.6) / (WINDOWS - 1);
    for (let i = 0; i < WINDOWS; i++) {
      object.position.set(-WIDTH / 2 + 0.8 + i * step, 8.75, 5.73);
      object.updateMatrix();
      mesh.current.setMatrixAt(i, object.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  }, []);

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, WINDOWS]} material={mat("#7a5236")}>
      <boxGeometry args={[0.36, 1.75, 0.08]} />
    </instancedMesh>
  );
}

/**
 * Experience: the 55-Window Palace. Three brick storeys, a projecting wooden
 * gallery with 55 carved windows on top, and a long tiled roof.
 */
export default function Palace() {
  const lowerWindows = Array.from({ length: 9 }, (_, i) => -12 + i * 3);

  return (
    <group>
      <Box size={[WIDTH + 0.2, 0.6, 12.2]} position={[0, 0.3, 0]} color={PALETTE.plaster} />
      <Box size={[WIDTH, 3.6, 11]} position={[0, 2.4, -0.5]} color={PALETTE.brick} />
      <Box size={[WIDTH, 3.2, 11]} position={[0, 5.8, -0.5]} color="#a34d35" />
      <Box size={[WIDTH, 2.6, 11]} position={[0, 8.7, -0.5]} color={PALETTE.brick} />
      {[4.2, 7.4].map((y) => (
        <Box key={y} size={[WIDTH + 0.12, 0.2, 11.12]} position={[0, y, -0.5]} color={PALETTE.wood} />
      ))}

      {/* Ground and first floor windows, a big central door */}
      {lowerWindows.map((x) => (
        <group key={x}>
          {Math.abs(x) > 0.1 && <Box size={[1, 1.5, 0.12]} position={[x, 2.6, 5.04]} color={PALETTE.wood} />}
          <Box size={[1.4, 1.7, 0.1]} position={[x, 5.9, 5.03]} color={PALETTE.woodLight} />
          <Box size={[1.1, 1.4, 0.12]} position={[x, 5.9, 5.05]} color={PALETTE.wood} />
        </group>
      ))}
      <Box size={[2.2, 3, 0.14]} position={[0, 2.1, 5.05]} color={PALETTE.wood} />

      {/* The 55-window gallery */}
      <Box size={[WIDTH - 0.6, 2.6, 0.7]} position={[0, 8.75, 5.35]} color={PALETTE.wood} />
      <GalleryWindows />

      {/* Roof */}
      <Box size={[WIDTH + 0.8, 0.25, 12.4]} position={[0, 10.05, -0.5]} color={PALETTE.wood} />
      <Prism width={13} height={3.2} depth={WIDTH + 1} position={[0, 10.1, -0.5]} rotation={[0, Math.PI / 2, 0]} color={PALETTE.tile} />
    </group>
  );
}

/** The palace wing that houses the art gallery, east of the Golden Gate. */
export function GalleryWing() {
  return (
    <group>
      <Box size={[12, 0.5, 11]} position={[0, 0.25, 0]} color={PALETTE.plaster} />
      <Box size={[11.6, 9.4, 10.4]} position={[0, 5.2, 0]} color={PALETTE.brick} />
      {[3.4, 6.6].map((y) => (
        <Box key={y} size={[11.72, 0.18, 10.52]} position={[0, y, 0]} color={PALETTE.wood} />
      ))}
      {[-4, -1.3, 1.3, 4].map((x) =>
        [2, 5, 8.2].map((y) => (
          <Box key={`${x},${y}`} size={[1, 1.3, 0.12]} position={[x, y, 5.24]} color={PALETTE.wood} />
        )),
      )}
      <Box size={[12.4, 0.22, 11.2]} position={[0, 9.95, 0]} color={PALETTE.wood} />
      <Prism width={11.6} height={2.8} depth={12.4} position={[0, 10, 0]} rotation={[0, Math.PI / 2, 0]} color={PALETTE.tile} />
    </group>
  );
}

/** A short wall joining the palace to the Golden Gate. */
export function GateWall() {
  return (
    <group>
      <Box size={[4, 6, 6.6]} position={[0, 3, 0]} color={PALETTE.brick} />
      <Box size={[4.4, 0.4, 7]} position={[0, 6.2, 0]} color={PALETTE.tile} />
    </group>
  );
}
