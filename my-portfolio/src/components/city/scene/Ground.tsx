"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";

import {
  BLOCK_SIZE,
  BLOCKS,
  LOT_SIZE,
  ROAD_SPAN,
  ROAD_WIDTH,
  ROADS,
  SIDEWALK_HEIGHT,
} from "../layout";
import { driveToPoint } from "../store";
import { mat, PALETTE } from "./parts";

const ROAD_Y = 0.04;
const EDGE = ROAD_SPAN / 2;

/** Positions (and orientation) of centre-line dashes and crosswalk stripes. */
function useMarkings() {
  return useMemo(() => {
    const nearCrossroads = (t: number) => ROADS.some((r) => Math.abs(t - r) < ROAD_WIDTH / 2 + 1.8);
    const dashes: { x: number; z: number; alongX: boolean }[] = [];
    for (const r of ROADS) {
      for (let t = -EDGE + 2; t <= EDGE - 2; t += 3.6) {
        if (nearCrossroads(t)) continue;
        dashes.push({ x: t, z: r, alongX: true });
        dashes.push({ x: r, z: t, alongX: false });
      }
    }

    // Zebra crossings on every arm of every crossroads.
    const stripes: { x: number; z: number; alongX: boolean }[] = [];
    const gap = ROAD_WIDTH / 2 + 1.2;
    for (const cx of ROADS) {
      for (const cz of ROADS) {
        for (const [dx, dz] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          const x = cx + dx * gap;
          const z = cz + dz * gap;
          if (Math.abs(x) > EDGE || Math.abs(z) > EDGE) continue;
          const roadAlongX = dx !== 0;
          for (let k = -2; k <= 2; k++) {
            stripes.push(
              roadAlongX
                ? { x, z: cz + k * 1.25, alongX: true }
                : { x: cx + k * 1.25, z, alongX: false },
            );
          }
        }
      }
    }
    return { dashes, stripes };
  }, []);
}

function Markings({
  items,
  size,
}: {
  items: { x: number; z: number; alongX: boolean }[];
  size: [number, number];
}) {
  const mesh = useRef<THREE.InstancedMesh>(null!);

  useLayoutEffect(() => {
    const object = new THREE.Object3D();
    items.forEach((item, i) => {
      object.position.set(item.x, ROAD_Y + 0.006, item.z);
      object.rotation.set(-Math.PI / 2, 0, item.alongX ? 0 : Math.PI / 2);
      object.updateMatrix();
      mesh.current.setMatrixAt(i, object.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  }, [items]);

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, items.length]} material={mat(PALETTE.marking)} receiveShadow>
      <planeGeometry args={size} />
    </instancedMesh>
  );
}

/** Grass, roads, sidewalks and lawns. Clicking anywhere drives the car there. */
export default function Ground() {
  const { dashes, stripes } = useMarkings();

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 6) return; // ignore the end of a drag
    driveToPoint(e.point.x, e.point.z);
  };

  return (
    <>
      <mesh rotation-x={-Math.PI / 2} material={mat(PALETTE.grass)} receiveShadow>
        <planeGeometry args={[240, 240]} />
      </mesh>

      {ROADS.map((r) => (
        <group key={r}>
          <mesh position={[0, ROAD_Y / 2, r]} material={mat(PALETTE.asphalt, 0.95)} receiveShadow>
            <boxGeometry args={[ROAD_SPAN, ROAD_Y, ROAD_WIDTH]} />
          </mesh>
          <mesh position={[r, ROAD_Y / 2, 0]} material={mat(PALETTE.asphalt, 0.95)} receiveShadow>
            <boxGeometry args={[ROAD_WIDTH, ROAD_Y, ROAD_SPAN]} />
          </mesh>
        </group>
      ))}

      {BLOCKS.map(([x, z]) => (
        <group key={`${x},${z}`} position={[x, 0, z]}>
          <mesh position-y={SIDEWALK_HEIGHT / 2} material={mat(PALETTE.sidewalk)} receiveShadow>
            <boxGeometry args={[BLOCK_SIZE, SIDEWALK_HEIGHT, BLOCK_SIZE]} />
          </mesh>
          <mesh position-y={SIDEWALK_HEIGHT + 0.02} material={mat(PALETTE.lawn)} receiveShadow>
            <boxGeometry args={[LOT_SIZE, 0.04, LOT_SIZE]} />
          </mesh>
        </group>
      ))}

      <Markings items={dashes} size={[1.8, 0.16]} />
      <Markings items={stripes} size={[2.2, 0.6]} />

      {/* Invisible click catcher just above the ground */}
      <mesh rotation-x={-Math.PI / 2} position-y={0.3} visible={false} onClick={onClick}>
        <planeGeometry args={[240, 240]} />
      </mesh>
    </>
  );
}
