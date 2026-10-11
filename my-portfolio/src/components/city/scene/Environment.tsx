"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";

import { POKHARA_AREA, ROAD2_AREA, ROAD_AREA, SWAYAMBHU_AREA, TOWN_AREA, trees, type Rect } from "../layout";
import { driveToPoint } from "../store";
import { mat, PALETTE } from "./parts";

// Brick paving covers the whole town area.
const TOWN = {
  x: (TOWN_AREA[0] + TOWN_AREA[1]) / 2,
  z: (TOWN_AREA[2] + TOWN_AREA[3]) / 2,
  width: TOWN_AREA[1] - TOWN_AREA[0],
  depth: TOWN_AREA[3] - TOWN_AREA[2],
};
const BRICK_TILE = 3; // world units per texture repeat

/** Running-bond brick paving, drawn once into a canvas. */
function useBrickTexture() {
  return useMemo(() => {
    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#7e4a35"; // mortar
    ctx.fillRect(0, 0, size, size);

    const colors = ["#ad6244", "#a2583c", "#b66d4d", "#a65f45", "#9b5237", "#b26446"];
    let seed = 11;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const w = 64;
    const h = 32;
    for (let row = 0; row < size / h; row++) {
      const offset = row % 2 ? w / 2 : 0;
      for (let x = -w; x < size + w; x += w) {
        ctx.fillStyle = colors[Math.floor(rand() * colors.length)];
        ctx.fillRect(x + offset + 2, row * h + 2, w - 4, h - 4);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(TOWN.width / BRICK_TILE, TOWN.depth / BRICK_TILE);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    return texture;
  }, []);
}

let stoneTexture: THREE.CanvasTexture | null = null;

/**
 * Grey-gold stone flags, for Swayambhunath's square, Lakeside, the roads and
 * the cycle path round the lake. Drawn once and shared.
 */
export function getStoneTexture() {
  if (stoneTexture) return stoneTexture;
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#8e8572"; // joints
  ctx.fillRect(0, 0, size, size);

  const colors = ["#c9bea6", "#bfb399", "#d2c8b2", "#b8ad94", "#c4b89f"];
  let seed = 23;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  // Rows of slabs of varying length. Each row's slabs add up to exactly one
  // tile width and wrap round, so the texture repeats without a seam.
  const h = 64;
  for (let y = 0; y < size; y += h) {
    const widths: number[] = [];
    let total = 0;
    while (total < size - 140) {
      const w = 70 + Math.floor(rand() * 70);
      widths.push(w);
      total += w;
    }
    if (size - total < 40) widths[widths.length - 1] += size - total;
    else widths.push(size - total);

    let x = Math.floor(rand() * size); // stagger the rows
    for (const w of widths) {
      ctx.fillStyle = colors[Math.floor(rand() * colors.length)];
      ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
      if (x + w > size) ctx.fillRect(x + 2 - size, y + 2, w - 4, h - 4);
      x = (x + w) % size;
    }
  }

  stoneTexture = new THREE.CanvasTexture(canvas);
  stoneTexture.wrapS = stoneTexture.wrapT = THREE.RepeatWrapping;
  stoneTexture.colorSpace = THREE.SRGBColorSpace;
  stoneTexture.anisotropy = 8;
  return stoneTexture;
}

/** A flat paved patch over the fields. Clicking it drives there. */
function Paving({ area, map, tile, onClick }: { area: Rect; map: THREE.Texture; tile: number; onClick: (e: ThreeEvent<MouseEvent>) => void }) {
  const [x0, x1, z0, z1] = area;
  const texture = useMemo(() => {
    const t = map.clone();
    t.needsUpdate = true;
    t.repeat.set((x1 - x0) / tile, (z1 - z0) / tile);
    return t;
  }, [map, tile, x0, x1, z0, z1]);
  return (
    <mesh rotation-x={-Math.PI / 2} position={[(x0 + x1) / 2, 0, (z0 + z1) / 2]} receiveShadow onClick={onClick}>
      <planeGeometry args={[x1 - x0, z1 - z0]} />
      <meshStandardMaterial map={texture} roughness={0.95} />
    </mesh>
  );
}

/** Sky: a soft vertical gradient behind everything. */
function SkyGradient() {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 2;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;
    const gradient = ctx.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, PALETTE.skyTop);
    gradient.addColorStop(0.55, "#cfe0ec");
    gradient.addColorStop(1, PALETTE.haze);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2, 256);
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);

  return <primitive attach="background" object={texture} />;
}

/** Machhapuchhre, the "fishtail": twin summits that tower over Pokhara. */
const FISHTAIL = { x: -336, z: -440 };

/** The Himalaya on the northern horizon (not fogged, so they stay crisp). */
function Mountains() {
  const peaks = useMemo(() => {
    let seed = 8848;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const list: { x: number; z: number; height: number; radius: number; far: boolean }[] = [];
    for (let x = -720; x <= 460; x += 46 + rand() * 30) {
      list.push({ x, z: -360 - rand() * 40, height: 70 + rand() * 90, radius: 55 + rand() * 45, far: false });
      list.push({ x: x + 25, z: -430 - rand() * 40, height: 110 + rand() * 80, radius: 70 + rand() * 40, far: true });
    }
    // Leave room for Machhapuchhre, which stands out in front above Pokhara.
    return list.filter((p) => Math.abs(p.x - FISHTAIL.x) > 40);
  }, []);

  const rock = useMemo(() => new THREE.MeshBasicMaterial({ color: "#9fb2c7", fog: false }), []);
  const rockFar = useMemo(() => new THREE.MeshBasicMaterial({ color: "#bccadb", fog: false }), []);
  const snow = useMemo(() => new THREE.MeshBasicMaterial({ color: "#f6f8fb", fog: false }), []);

  return (
    <group>
      {peaks.map((p, i) => (
        <group key={i} position={[p.x, 0, p.z]}>
          <mesh position-y={p.height / 2} material={p.far ? rockFar : rock}>
            <coneGeometry args={[p.radius, p.height, 6]} />
          </mesh>
          <mesh position-y={p.height * 0.84} material={snow}>
            <coneGeometry args={[p.radius * 0.32, p.height * 0.32, 6]} />
          </mesh>
        </group>
      ))}
      <group position={[FISHTAIL.x, 0, FISHTAIL.z]}>
        {[
          [0, 0, 260, 64],
          [28, 10, 232, 50],
        ].map(([x, z, height, radius], i) => (
          <group key={i} position={[x, 0, z]}>
            <mesh position-y={height / 2} material={rock}>
              <coneGeometry args={[radius, height, 5]} />
            </mesh>
            <mesh position-y={height * 0.78} material={snow}>
              <coneGeometry args={[radius * 0.44, height * 0.44, 5]} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

/** Low green hills around the valley, softened by the haze. */
function Hills() {
  const hills = useMemo(
    () =>
      [
        [-200, 150, 60, 24],
        [-170, 190, 90, 30],
        [-40, 230, 110, 22],
        [120, 220, 90, 28],
        [230, 120, 80, 24],
        [240, -60, 90, 30],
        [-215, -170, 75, 26],
        // Low ridges beyond Phewa Lake, behind the houses on its far shore
        [-610, -60, 90, 22],
        [-630, 40, 100, 26],
        [-590, 130, 80, 20],
        [-120, -190, 70, 20],
        [150, -200, 75, 22],
      ] as [number, number, number, number][],
    [],
  );

  return (
    <group>
      {hills.map(([x, z, radius, height], i) => (
        <mesh key={i} position={[x, 0, z]} scale={[radius, height, radius]} material={mat("#8fa86c")}>
          <sphereGeometry args={[1, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
      ))}
    </group>
  );
}

const round = trees.filter((t) => t.kind === 0);
const tall = trees.filter((t) => t.kind === 1);

/** Trees on the fields around town. */
function Trees() {
  const trunks = useRef<THREE.InstancedMesh>(null!);
  const crowns = useRef<THREE.InstancedMesh>(null!);
  const pines = useRef<THREE.InstancedMesh>(null!);

  useLayoutEffect(() => {
    const object = new THREE.Object3D();
    const color = new THREE.Color();
    trees.forEach((tree, i) => {
      object.position.set(tree.position[0], 0.9 * tree.scale, tree.position[1]);
      object.rotation.set(0, 0, 0);
      object.scale.setScalar(tree.scale);
      object.updateMatrix();
      trunks.current.setMatrixAt(i, object.matrix);
    });
    trunks.current.instanceMatrix.needsUpdate = true;

    const place = (mesh: THREE.InstancedMesh, list: typeof trees, lift: number) => {
      list.forEach((tree, i) => {
        const [x, z] = tree.position;
        object.position.set(x, lift * tree.scale, z);
        object.rotation.set(0, (x * 13 + z * 7) % Math.PI, 0);
        object.scale.setScalar(tree.scale);
        object.updateMatrix();
        mesh.setMatrixAt(i, object.matrix);
        mesh.setColorAt(i, color.set(PALETTE.foliage[Math.abs(Math.round(x * 3 + z)) % PALETTE.foliage.length]));
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    };
    place(crowns.current, round, 2.6);
    place(pines.current, tall, 3);
  }, []);

  return (
    <>
      <instancedMesh ref={trunks} args={[undefined, undefined, trees.length]} material={mat(PALETTE.trunk)} castShadow>
        <cylinderGeometry args={[0.2, 0.28, 1.8, 6]} />
      </instancedMesh>
      <instancedMesh ref={crowns} args={[undefined, undefined, round.length]} castShadow>
        <icosahedronGeometry args={[1.6, 0]} />
        <meshStandardMaterial roughness={0.9} flatShading />
      </instancedMesh>
      <instancedMesh ref={pines} args={[undefined, undefined, tall.length]} castShadow>
        <coneGeometry args={[1.3, 3.6, 7]} />
        <meshStandardMaterial roughness={0.9} flatShading />
      </instancedMesh>
    </>
  );
}

/** Ground, sky, mountains and outskirts. Clicking the paving drives the car there. */
export default function Environment() {
  const brick = useBrickTexture();
  const stone = useMemo(() => getStoneTexture(), []);

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 6) return; // ignore the end of a drag
    driveToPoint(e.point.x, e.point.z);
  };

  return (
    <>
      <SkyGradient />
      <Mountains />
      <Hills />

      {/* Fields around the town */}
      <mesh rotation-x={-Math.PI / 2} position={[-150, -0.02, 0]} material={mat(PALETTE.field)} receiveShadow>
        <planeGeometry args={[1500, 1100]} />
      </mesh>

      {/* Brick paving across the town */}
      <mesh rotation-x={-Math.PI / 2} position={[TOWN.x, 0, TOWN.z]} receiveShadow onClick={onClick}>
        <planeGeometry args={[TOWN.width, TOWN.depth]} />
        <meshStandardMaterial map={brick} roughness={0.95} />
      </mesh>

      {/* Stone flags round Swayambhunath's hill, along Lakeside and on the roads */}
      <Paving area={SWAYAMBHU_AREA} map={stone} tile={6} onClick={onClick} />
      <Paving area={ROAD_AREA} map={stone} tile={6} onClick={onClick} />
      <Paving area={POKHARA_AREA} map={stone} tile={6} onClick={onClick} />
      <Paving area={ROAD2_AREA} map={stone} tile={6} onClick={onClick} />

      <Trees />
    </>
  );
}
