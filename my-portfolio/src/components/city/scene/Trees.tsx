"use client";

import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";

import { groundHeight, trees } from "../layout";
import { mat, PALETTE } from "./parts";

const round = trees.filter((t) => t.kind === 0);
const cones = trees.filter((t) => t.kind === 1);

/** Low-poly trees: one instanced mesh per part, so they cost a few draw calls. */
export default function Trees() {
  const trunks = useRef<THREE.InstancedMesh>(null!);
  const crowns = useRef<THREE.InstancedMesh>(null!);
  const pines = useRef<THREE.InstancedMesh>(null!);

  useLayoutEffect(() => {
    const object = new THREE.Object3D();
    const color = new THREE.Color();

    trees.forEach((tree, i) => {
      const [x, z] = tree.position;
      object.position.set(x, groundHeight(x, z) + 0.6 * tree.scale, z);
      object.rotation.set(0, 0, 0);
      object.scale.setScalar(tree.scale);
      object.updateMatrix();
      trunks.current.setMatrixAt(i, object.matrix);
    });

    const place = (mesh: THREE.InstancedMesh, list: typeof trees, lift: number) => {
      list.forEach((tree, i) => {
        const [x, z] = tree.position;
        object.position.set(x, groundHeight(x, z) + lift * tree.scale, z);
        object.rotation.set(0, (x * 13 + z * 7) % Math.PI, 0);
        object.scale.setScalar(tree.scale);
        object.updateMatrix();
        mesh.setMatrixAt(i, object.matrix);
        mesh.setColorAt(i, color.set(PALETTE.foliage[Math.abs(Math.round(x * 3 + z)) % PALETTE.foliage.length]));
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    };
    place(crowns.current, round, 2);
    place(pines.current, cones, 2.2);
    trunks.current.instanceMatrix.needsUpdate = true;
  }, []);

  return (
    <>
      <instancedMesh ref={trunks} args={[undefined, undefined, trees.length]} material={mat(PALETTE.trunk)} castShadow>
        <cylinderGeometry args={[0.16, 0.22, 1.2, 6]} />
      </instancedMesh>
      <instancedMesh ref={crowns} args={[undefined, undefined, round.length]} castShadow receiveShadow>
        <icosahedronGeometry args={[1.15, 0]} />
        <meshStandardMaterial roughness={0.9} flatShading />
      </instancedMesh>
      <instancedMesh ref={pines} args={[undefined, undefined, cones.length]} castShadow receiveShadow>
        <coneGeometry args={[1, 2.6, 7]} />
        <meshStandardMaterial roughness={0.9} flatShading />
      </instancedMesh>
    </>
  );
}
