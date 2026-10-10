"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { decor, FOUNTAIN, LOT_SIZE, SIDEWALK_HEIGHT, type Decor } from "../layout";
import { Box, mat, PALETTE, Prism } from "./parts";

const LOT_Y = SIDEWALK_HEIGHT + 0.04;

/** Window positions on the two faces the camera sees (south and east). */
function windowMatrices(buildings: Decor[]) {
  const object = new THREE.Object3D();
  const matrices: THREE.Matrix4[] = [];
  for (const b of buildings) {
    if (b.roof === "gable") continue;
    const [cx, cz] = b.center;
    const [w, d] = b.size;
    for (let y = 1.4; y < b.height - 0.7; y += 1.6) {
      for (let x = -w / 2 + 1.1; x <= w / 2 - 1.1; x += 1.5) {
        object.position.set(cx + x, LOT_Y + y, cz + d / 2 + 0.03);
        object.rotation.set(0, 0, 0);
        object.updateMatrix();
        matrices.push(object.matrix.clone());
      }
      for (let z = -d / 2 + 1.1; z <= d / 2 - 1.1; z += 1.5) {
        object.position.set(cx + w / 2 + 0.03, LOT_Y + y, cz + z);
        object.rotation.set(0, Math.PI / 2, 0);
        object.updateMatrix();
        matrices.push(object.matrix.clone());
      }
    }
  }
  return matrices;
}

function Windows() {
  const mesh = useRef<THREE.InstancedMesh>(null!);
  const matrices = useMemo(() => windowMatrices(decor), []);

  useLayoutEffect(() => {
    matrices.forEach((m, i) => mesh.current.setMatrixAt(i, m));
    mesh.current.instanceMatrix.needsUpdate = true;
  }, [matrices]);

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, matrices.length]} material={mat(PALETTE.glass, 0.4)}>
      <boxGeometry args={[0.8, 0.9, 0.06]} />
    </instancedMesh>
  );
}

function Building({ b }: { b: Decor }) {
  const [w, d] = b.size;
  const [x, z] = b.center;

  if (b.roof === "gable") {
    return (
      <group position={[x, LOT_Y, z]}>
        <Box size={[w, b.height, d]} position={[0, b.height / 2, 0]} color={b.color} />
        <Prism width={d + 0.6} height={1.8} depth={w + 0.6} position={[0, b.height, 0]} rotation={[0, Math.PI / 2, 0]} color="#3d405b" />
        <Box size={[1, 1.8, 0.08]} position={[-1.2, 0.9, d / 2 + 0.03]} color={PALETTE.wood} />
        <Box size={[1.2, 0.9, 0.08]} position={[1.4, 1.7, d / 2 + 0.03]} color={PALETTE.glass} roughness={0.4} />
      </group>
    );
  }

  return (
    <group position={[x, LOT_Y, z]}>
      <Box size={[w, b.height, d]} position={[0, b.height / 2, 0]} color={b.color} />
      <Box size={[w + 0.2, 0.35, d + 0.2]} position={[0, b.height + 0.17, 0]} color={PALETTE.stone} />
    </group>
  );
}

function Fountain() {
  const jet = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    jet.current.scale.y = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.12;
  });

  return (
    <group position={[FOUNTAIN[0], LOT_Y, FOUNTAIN[1]]}>
      <mesh position-y={0.25} material={mat(PALETTE.stone)} castShadow receiveShadow>
        <cylinderGeometry args={[2.8, 3, 0.5, 32]} />
      </mesh>
      <mesh position-y={0.47} material={mat("#8ecae6", 0.3)}>
        <cylinderGeometry args={[2.5, 2.5, 0.06, 32]} />
      </mesh>
      <mesh position-y={1} material={mat(PALETTE.stone)} castShadow>
        <cylinderGeometry args={[0.3, 0.45, 1.2, 12]} />
      </mesh>
      <mesh position-y={1.65} material={mat(PALETTE.stone)} castShadow>
        <cylinderGeometry args={[0.9, 0.45, 0.3, 16]} />
      </mesh>
      <mesh ref={jet} position-y={2.2} material={mat("#bfe3f2", 0.3)}>
        <coneGeometry args={[0.35, 1, 10]} />
      </mesh>
      {/* Paving around it */}
      <mesh position-y={0.01} rotation-x={-Math.PI / 2} material={mat(PALETTE.sidewalk)} receiveShadow>
        <circleGeometry args={[4.2, 40]} />
      </mesh>
    </group>
  );
}

function Bench({ position, rotation = 0 }: { position: [number, number]; rotation?: number }) {
  return (
    <group position={[position[0], LOT_Y, position[1]]} rotation-y={rotation}>
      <Box size={[1.8, 0.12, 0.55]} position={[0, 0.48, 0]} color={PALETTE.wood} />
      <Box size={[1.8, 0.5, 0.1]} position={[0, 0.78, -0.25]} color={PALETTE.wood} />
      <Box size={[0.1, 0.45, 0.5]} position={[-0.75, 0.22, 0]} color={PALETTE.dark} />
      <Box size={[0.1, 0.45, 0.5]} position={[0.75, 0.22, 0]} color={PALETTE.dark} />
    </group>
  );
}

/** Ordinary buildings, windows, the fountain plaza and the park. */
export default function Scenery() {
  return (
    <>
      {decor.map((b) => (
        <Building key={b.center.join(",")} b={b} />
      ))}
      <Windows />
      <Fountain />

      {/* A path through the park */}
      <mesh position={[15, LOT_Y + 0.005, 10]} rotation-x={-Math.PI / 2} material={mat(PALETTE.sidewalk)} receiveShadow>
        <planeGeometry args={[LOT_SIZE - 2, 1.6]} />
      </mesh>
      <Bench position={[11, 11.6]} />
      <Bench position={[19, 11.6]} />
    </>
  );
}
