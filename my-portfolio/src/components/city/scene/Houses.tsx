"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { houses } from "../layout";
import { PALETTE } from "./parts";

const STOREY = 2.6;

/** Unit gable: a triangle (base 1 along x, height 1) extruded 1 along z, base at y = 0. */
function useGableGeometry() {
  return useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.5, 0);
    shape.lineTo(0.5, 0);
    shape.lineTo(0, 1);
    shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, { depth: 1, bevelEnabled: false });
    g.translate(0, 0, -0.5);
    return g;
  }, []);
}

interface Part {
  position: [number, number, number];
  scale: [number, number, number];
  rotationY: number;
  color?: string;
}

/** Walls, roofs, eaves and street-facing windows/doors for every row house. */
function useParts() {
  return useMemo(() => {
    const walls: Part[] = [];
    const roofs: Part[] = [];
    const eaves: Part[] = [];
    const openings: Part[] = [];
    const frames: Part[] = [];

    for (const h of houses) {
      const [cx, cz] = h.center;
      const [sx, sz] = h.size;
      const facesZ = h.facing[0] === 0;
      const depth = facesZ ? sz : sx;
      const turn = facesZ ? 0 : Math.PI / 2;

      walls.push({ position: [cx, h.height / 2, cz], scale: [sx, h.height, sz], rotationY: 0, color: h.wall });
      eaves.push({ position: [cx, h.height - 0.08, cz], scale: [sx + 0.9, 0.16, sz + 0.9], rotationY: 0 });
      roofs.push({
        position: [cx, h.height, cz],
        // Ridge runs along the street: the gable's base spans the house depth.
        scale: [depth + 1.2, 2 + depth * 0.06, h.front + 0.25],
        rotationY: facesZ ? Math.PI / 2 : 0,
        color: h.roof,
      });

      // Openings on the street front.
      const out = depth / 2 + 0.06;
      const fx = cx + h.facing[0] * out;
      const fz = cz + h.facing[1] * out;
      // Along-the-front axis.
      const ax = facesZ ? 1 : 0;
      const az = facesZ ? 0 : 1;
      const place = (offset: number, y: number, w: number, hgt: number) => {
        const position: [number, number, number] = [fx + ax * offset, y, fz + az * offset];
        openings.push({ position, scale: [w, hgt, 0.16], rotationY: turn });
        frames.push({
          position: [position[0] - h.facing[0] * 0.03, y, position[2] - h.facing[1] * 0.03],
          scale: [w + 0.3, hgt + 0.3, 0.12],
          rotationY: turn,
        });
      };

      place(0, 1.05, 1.1, 2.1); // door
      const storeys = Math.floor((h.height - 0.6) / STOREY);
      for (let s = 1; s < storeys; s++) {
        const top = s === storeys - 1;
        const count = Math.max(1, Math.floor((h.front - 1) / (top ? 2.1 : 1.7)));
        const span = (count - 1) * (top ? 2.1 : 1.7);
        for (let i = 0; i < count; i++) {
          place(-span / 2 + i * (top ? 2.1 : 1.7), s * STOREY + 1.2, top ? 1.4 : 0.9, top ? 1 : 1.25);
        }
      }
    }
    return { walls, roofs, eaves, openings, frames };
  }, []);
}

function Instances({
  parts,
  geometry,
  color,
  shadows = true,
}: {
  parts: Part[];
  geometry: THREE.BufferGeometry;
  color?: string;
  shadows?: boolean;
}) {
  const mesh = useRef<THREE.InstancedMesh>(null!);

  useLayoutEffect(() => {
    const object = new THREE.Object3D();
    const c = new THREE.Color();
    parts.forEach((p, i) => {
      object.position.set(...p.position);
      object.rotation.set(0, p.rotationY, 0);
      object.scale.set(...p.scale);
      object.updateMatrix();
      mesh.current.setMatrixAt(i, object.matrix);
      if (p.color) mesh.current.setColorAt(i, c.set(p.color));
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
  }, [parts]);

  return (
    <instancedMesh
      ref={mesh}
      args={[geometry, undefined, parts.length]}
      castShadow={shadows}
      receiveShadow
    >
      <meshStandardMaterial color={color ?? "#ffffff"} roughness={0.9} />
    </instancedMesh>
  );
}

/** The Newari row houses that line the squares and lanes. */
export default function Houses() {
  const { walls, roofs, eaves, openings, frames } = useParts();
  const box = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const gable = useGableGeometry();

  return (
    <>
      <Instances parts={walls} geometry={box} />
      <Instances parts={roofs} geometry={gable} />
      <Instances parts={eaves} geometry={box} color={PALETTE.wood} />
      <Instances parts={frames} geometry={box} color={PALETTE.woodLight} shadows={false} />
      <Instances parts={openings} geometry={box} color={PALETTE.wood} shadows={false} />
    </>
  );
}
