"use client";

import { useLayoutEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { HILL, seeded } from "../../layout";
import { cityStore } from "../../store";
import { Box, Frustum, mat, PALETTE } from "../parts";
import { Guardian, PagodaTiers, Pinnacle } from "./pagoda";

// Swayambhunath, the "Monkey Temple": a white stupa with the Buddha's eyes on
// a wooded hill, a long stairway up its east side to a giant golden vajra,
// shrines round the top, prayer flags everywhere and prayer wheels at its
// foot. Everything is placed relative to the hill's centre; local +x is east,
// towards Bhaktapur.

const TOP = HILL.height; // the paved hilltop
const WHITE = "#f4f1ea";
const MAROON = "#7a2e2a";
const gold = () => mat(PALETTE.gold, 0.35, 0.6);

/** Height of the wooded slope at a distance `r` from the centre (three terraces). */
function slope(r: number) {
  if (r >= 21) return (4.4 * (HILL.radius - r)) / (HILL.radius - 21);
  if (r >= 17) return 4.4 + (4.2 * (21 - r)) / 4;
  return 8.6 + (3.4 * (17 - r)) / (17 - HILL.topRadius);
}

// ---------------------------------------------------------------------------
// The hill and what stands on top (scenery)
// ---------------------------------------------------------------------------

const TREES = (() => {
  const rand = seeded(4021);
  const list: { x: number; y: number; z: number; scale: number; pine: boolean }[] = [];
  while (list.length < 54) {
    const a = rand() * Math.PI * 2 - Math.PI;
    const r = 15 + rand() * 9;
    if (Math.abs(a) < 0.22) continue; // the stairway
    if (Math.abs(a - Math.PI / 2) < 0.2) continue; // a clear view of the stupa from the south
    if (r > 21.5 && Math.abs(a + Math.PI / 2) < 0.4) continue; // the prayer wheels
    list.push({ x: Math.cos(a) * r, y: slope(r), z: Math.sin(a) * r, scale: 0.9 + rand() * 0.7, pine: rand() < 0.45 });
  }
  return list;
})();

const ROUND = TREES.filter((t) => !t.pine);
const TALL = TREES.filter((t) => t.pine);

function SlopeTrees() {
  const trunks = useRef<THREE.InstancedMesh>(null!);
  const crowns = useRef<THREE.InstancedMesh>(null!);
  const pines = useRef<THREE.InstancedMesh>(null!);

  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    const color = new THREE.Color();
    TREES.forEach((t, i) => {
      o.position.set(t.x, t.y + 0.8 * t.scale, t.z);
      o.rotation.set(0, 0, 0);
      o.scale.setScalar(t.scale);
      o.updateMatrix();
      trunks.current.setMatrixAt(i, o.matrix);
    });
    trunks.current.instanceMatrix.needsUpdate = true;
    const place = (mesh: THREE.InstancedMesh, list: typeof TREES, lift: number) => {
      list.forEach((t, i) => {
        o.position.set(t.x, t.y + lift * t.scale, t.z);
        o.rotation.set(0, t.x * 3 + t.z, 0);
        o.scale.setScalar(t.scale);
        o.updateMatrix();
        mesh.setMatrixAt(i, o.matrix);
        mesh.setColorAt(i, color.set(PALETTE.foliage[i % PALETTE.foliage.length]));
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    };
    place(crowns.current, ROUND, 2.4);
    place(pines.current, TALL, 2.8);
  }, []);

  return (
    <>
      <instancedMesh ref={trunks} args={[undefined, undefined, TREES.length]} material={mat(PALETTE.trunk)} castShadow>
        <cylinderGeometry args={[0.18, 0.26, 1.6, 6]} />
      </instancedMesh>
      <instancedMesh ref={crowns} args={[undefined, undefined, ROUND.length]} castShadow>
        <icosahedronGeometry args={[1.5, 0]} />
        <meshStandardMaterial roughness={0.9} flatShading />
      </instancedMesh>
      <instancedMesh ref={pines} args={[undefined, undefined, TALL.length]} castShadow>
        <coneGeometry args={[1.2, 3.4, 7]} />
        <meshStandardMaterial roughness={0.9} flatShading />
      </instancedMesh>
    </>
  );
}

/** Pratappur and Anantapur: the two white shikhara towers beside the stupa. */
function Shikhara() {
  return (
    <group>
      <Box size={[2.8, 1.2, 2.8]} position={[0, 0.6, 0]} color={PALETTE.stone} />
      <Box size={[2.2, 2.2, 2.2]} position={[0, 2.3, 0]} color={WHITE} />
      <Box size={[0.8, 1.4, 0.1]} position={[0, 1.95, 1.11]} color={PALETTE.wood} />
      <Frustum bottom={2.3} top={0.55} height={4.8} position={[0, 5.8, 0]} color={WHITE} />
      <Pinnacle y={8.2} scale={0.55} />
    </group>
  );
}

/** A small votive stupa (chaitya). */
function Chaitya({ scale = 1 }: { scale?: number }) {
  return (
    <group scale={scale}>
      <Box size={[1.3, 0.5, 1.3]} position={[0, 0.25, 0]} color={PALETTE.stone} />
      <mesh position-y={0.5} material={mat(WHITE)} castShadow>
        <sphereGeometry args={[0.6, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <Box size={[0.36, 0.3, 0.36]} position={[0, 1.2, 0]} color={PALETTE.gold} roughness={0.35} metalness={0.5} />
      <mesh position-y={1.75} material={gold()} castShadow>
        <coneGeometry args={[0.2, 0.8, 10]} />
      </mesh>
    </group>
  );
}

const FLAG_COLORS = ["#2f6fd1", "#f4f4f0", "#d23c3c", "#3f9a4a", "#f2c230"];
const STRINGS = 8;
const FLAGS_PER_STRING = 18;

/** Prayer flags strung from the stupa's spire down to the edge of the hilltop. */
function PrayerFlags() {
  const mesh = useRef<THREE.InstancedMesh>(null!);
  const count = STRINGS * FLAGS_PER_STRING;

  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    const color = new THREE.Color();
    const top = new THREE.Vector3(0, TOP + 12.2, 0);
    const p = new THREE.Vector3();
    let i = 0;
    for (let s = 0; s < STRINGS; s++) {
      const a = Math.PI / STRINGS + (s * Math.PI * 2) / STRINGS;
      const bottom = new THREE.Vector3(Math.cos(a) * 12.9, TOP + 2.2, Math.sin(a) * 12.9);
      for (let f = 0; f < FLAGS_PER_STRING; f++, i++) {
        const t = (f + 0.5) / FLAGS_PER_STRING;
        p.lerpVectors(top, bottom, t);
        p.y -= 1.3 * 4 * t * (1 - t); // the string sags
        o.position.set(p.x, p.y - 0.2, p.z);
        // Each flag hangs in the plane of its string.
        o.rotation.set(0, -a, 0);
        o.updateMatrix();
        mesh.current.setMatrixAt(i, o.matrix);
        mesh.current.setColorAt(i, color.set(FLAG_COLORS[f % FLAG_COLORS.length]));
      }
    }
    mesh.current.instanceMatrix.needsUpdate = true;
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
  }, []);

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <planeGeometry args={[0.34, 0.42]} />
      <meshStandardMaterial roughness={0.9} side={THREE.DoubleSide} />
    </instancedMesh>
  );
}

/** The hill, the paved hilltop and the shrines on it (the stupa itself is a destination). */
export function SwayambhuHill() {
  const posts = Array.from({ length: STRINGS }, (_, s) => Math.PI / STRINGS + (s * Math.PI * 2) / STRINGS);
  return (
    <group>
      {/* Three wooded terraces and the stone-paved top */}
      <Frustum sides={14} bottom={HILL.radius * 2} top={42} height={4.4} position={[0, 2.2, 0]} color="#6f9150" />
      {/* Each terrace a little narrower than the top of the one below, leaving a ledge */}
      <Frustum sides={14} bottom={40} top={34} height={4.2} position={[0, 6.5, 0]} color="#678a4a" />
      <Frustum sides={14} bottom={32} top={HILL.topRadius * 2} height={3.4} position={[0, 10.3, 0]} color="#5f8445" />
      <Frustum sides={14} bottom={27.4} top={27.4} height={0.5} position={[0, TOP - 0.25, 0]} color={PALETTE.stone} />
      <SlopeTrees />

      <group position-y={TOP}>
        {/* The shikharas flank the top of the stairs */}
        {[-5.6, 5.6].map((z) => (
          <group key={z} position={[8.4, 0, z]}>
            <Shikhara />
          </group>
        ))}
        {/* Chaityas round the stupa */}
        {[75, 120, 165, 255, 300].map((deg) => {
          const a = (deg * Math.PI) / 180;
          return (
            <group key={deg} position={[Math.cos(a) * 10.8, 0, Math.sin(a) * 10.8]}>
              <Chaitya scale={deg % 2 ? 1 : 1.25} />
            </group>
          );
        })}
        {/* Harati Devi's little pagoda, north-west of the stupa */}
        <group position={[-8.6, 0, -7.4]} rotation-y={Math.PI / 4}>
          <Box size={[3.4, 0.4, 3.4]} position={[0, 0.2, 0]} color={PALETTE.stone} />
          <Box size={[2.6, 2, 2.6]} position={[0, 1.4, 0]} color={PALETTE.brick} />
          <Box size={[0.8, 1.3, 0.1]} position={[0, 1.05, 1.31]} color={PALETTE.wood} />
          <PagodaTiers y={2.4} wall={2.6} count={2} shrink={0.7} overhang={1.8} roofHeight={1.1} gap={1} />
        </group>
        {/* Posts the prayer flags are tied to */}
        {posts.map((a) => (
          <mesh key={a} position={[Math.cos(a) * 12.9, 1.1, Math.sin(a) * 12.9]} material={mat(PALETTE.woodLight)} castShadow>
            <cylinderGeometry args={[0.06, 0.08, 2.2, 6]} />
          </mesh>
        ))}
      </group>
      <PrayerFlags />
    </group>
  );
}

// ---------------------------------------------------------------------------
// Destinations: the stupa, the stairway and the prayer wheels
// ---------------------------------------------------------------------------

/** The Buddha's eyes, the "nose" (the Nepali numeral one) and the third eye. */
function Eyes() {
  const dark = mat("#1c2a4a", 0.6);
  return (
    <group position={[0, 7.25, 1.41]}>
      {[-1, 1].map((s) => (
        <group key={s} position-x={s * 0.55}>
          <mesh scale={[0.42, 0.17, 0.04]} material={mat("#f8f6ef", 0.6)}>
            <sphereGeometry args={[1, 16, 8]} />
          </mesh>
          <mesh position={[-s * 0.05, -0.02, 0.03]} scale={[0.13, 0.13, 0.03]} material={dark}>
            <sphereGeometry args={[1, 12, 8]} />
          </mesh>
          <mesh position={[0, 0.26, 0.01]} rotation-z={s * 0.12} material={dark}>
            <boxGeometry args={[0.72, 0.06, 0.02]} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, -0.36, 0.02]} rotation-z={-0.4} material={dark}>
        <torusGeometry args={[0.11, 0.03, 6, 16, Math.PI * 1.4]} />
      </mesh>
      <mesh position={[0.06, -0.58, 0.02]} rotation-z={0.25} material={dark}>
        <boxGeometry args={[0.05, 0.22, 0.02]} />
      </mesh>
      <mesh position={[0, 0.4, 0.02]} material={mat("#a3222e")}>
        <sphereGeometry args={[0.05, 10, 8]} />
      </mesh>
    </group>
  );
}

const DOME_WHEELS = 40;

/** Prayer wheels all the way round the foot of the dome, turning slowly. */
function DomeWheels() {
  const mesh = useRef<THREE.InstancedMesh>(null!);
  const o = useRef(new THREE.Object3D());
  useFrame(({ clock }) => {
    const obj = o.current;
    for (let i = 0; i < DOME_WHEELS; i++) {
      const a = (i / DOME_WHEELS) * Math.PI * 2;
      obj.position.set(Math.cos(a) * 6.35, 0.85, Math.sin(a) * 6.35);
      obj.rotation.set(0, clock.elapsedTime * 0.8 + i, 0);
      obj.updateMatrix();
      mesh.current.setMatrixAt(i, obj.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, DOME_WHEELS]} material={gold()} castShadow>
      <cylinderGeometry args={[0.16, 0.16, 0.48, 8]} />
    </instancedMesh>
  );
}

/** Education: the great stupa on the hilltop (placed at the hill's centre). */
export function GreatStupa() {
  return (
    <group position-y={TOP}>
      {/* Two round white terraces */}
      <mesh position-y={0.3} material={mat(WHITE)} castShadow receiveShadow>
        <cylinderGeometry args={[6.6, 6.8, 0.6, 40]} />
      </mesh>
      <mesh position-y={0.85} material={mat(WHITE)} castShadow receiveShadow>
        <cylinderGeometry args={[6, 6.15, 0.5, 40]} />
      </mesh>
      <DomeWheels />
      {/* The dome */}
      <mesh position-y={1.1} material={mat(WHITE, 0.7)} castShadow receiveShadow>
        <sphereGeometry args={[5.3, 40, 18, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      {/* The gilded harmika, with the Buddha's eyes looking out on all four sides */}
      <Box size={[2.8, 1.9, 2.8]} position={[0, 7.1, 0]} color={PALETTE.gold} roughness={0.35} metalness={0.5} />
      {[0, Math.PI / 2, Math.PI, -Math.PI / 2].map((r) => (
        <group key={r} rotation-y={r}>
          <Eyes />
        </group>
      ))}
      {/* Thirteen gilded rings */}
      {Array.from({ length: 13 }, (_, i) => {
        const radius = 1.42 - i * 0.065;
        return (
          <mesh key={i} position-y={8.05 + i * 0.32 + 0.14} material={gold()} castShadow>
            <cylinderGeometry args={[radius - 0.05, radius, 0.28, 20]} />
          </mesh>
        );
      })}
      {/* The umbrella and the pinnacle */}
      <mesh position-y={12.3} material={gold()}>
        <cylinderGeometry args={[1.15, 1.15, 0.1, 20]} />
      </mesh>
      <mesh position-y={12.6} material={gold()} castShadow>
        <coneGeometry args={[1.15, 0.6, 20]} />
      </mesh>
      <Pinnacle y={12.9} scale={0.85} />
    </group>
  );
}

/** The giant golden vajra (dorje) on its drum, at the top of the stairs. */
function Vajra() {
  return (
    <group>
      <mesh position-y={0.45} material={mat(PALETTE.stoneDark)} castShadow receiveShadow>
        <cylinderGeometry args={[1.5, 1.6, 0.9, 24]} />
      </mesh>
      <mesh position-y={0.96} material={gold()} castShadow>
        <cylinderGeometry args={[1.35, 1.35, 0.12, 24]} />
      </mesh>
      <group position-y={1.4}>
        <mesh material={gold()} castShadow>
          <sphereGeometry args={[0.3, 16, 12]} />
        </mesh>
        {[-1, 1].map((s) => (
          <group key={s}>
            <mesh position-z={s * 0.32} rotation-x={Math.PI / 2} material={gold()}>
              <cylinderGeometry args={[0.22, 0.22, 0.18, 14]} />
            </mesh>
            <mesh position-z={s * 0.86} rotation-x={(s * Math.PI) / 2} material={gold()} castShadow>
              <coneGeometry args={[0.42, 0.9, 12]} />
            </mesh>
            <mesh position-z={s * 1.34} material={gold()}>
              <sphereGeometry args={[0.09, 10, 8]} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

const STEPS = 24;
const STAIR_FROM = HILL.topRadius - 0.3; // starts just under the edge of the paved top
const STAIR_TO = 26;

/** Skills: the stone stairway up the east side, with the vajra at the top (placed at the hill's centre). */
export function VajraStairway() {
  const run = (STAIR_TO - STAIR_FROM) / STEPS;
  // A hair lower than the hilltop, so the top step never shares a plane with it.
  const rise = (TOP - 0.02) / STEPS;
  const slopeLength = Math.hypot(STAIR_TO - STAIR_FROM, TOP);
  const pitch = -Math.atan2(TOP, STAIR_TO - STAIR_FROM);
  return (
    <group>
      {Array.from({ length: STEPS }, (_, i) => {
        const h = (i + 1) * rise;
        return (
          <Box key={i} size={[run + 0.01, h, 3.4]} position={[STAIR_TO - (i + 0.5) * run, h / 2, 0]} color={PALETTE.stone} />
        );
      })}
      {/* Low walls along both sides */}
      {[-1, 1].map((s) => (
        <Box
          key={s}
          size={[slopeLength, 0.55, 0.3]}
          position={[(STAIR_FROM + STAIR_TO) / 2, TOP / 2 + 0.35, s * 1.85]}
          rotation={[0, 0, pitch]}
          color={PALETTE.stoneDark}
        />
      ))}
      {/* Stone guardians at the foot of the stairs */}
      {[-2.4, 2.4].map((z) => (
        <group key={z} position={[STAIR_TO + 0.9, 0, z]}>
          <Box size={[1.1, 0.7, 1.1]} position={[0, 0.35, 0]} color={PALETTE.stoneDark} />
          <group position-y={0.7} rotation-y={Math.PI / 2}>
            <Guardian position={[0, 0, 0]} scale={1.7} />
          </group>
        </group>
      ))}
      <group position={[11.5, TOP, 0]}>
        <Vajra />
      </group>
    </group>
  );
}

const WALL_WHEELS = 18;

/** Contact: a row of prayer wheels at the north foot of the hill (front faces +z). */
export function PrayerWheelWall() {
  const mesh = useRef<THREE.InstancedMesh>(null!);
  const o = useRef(new THREE.Object3D());
  const spin = useRef(0);

  // They turn slowly, and faster while someone's parked here to spin them.
  useFrame((_, dt) => {
    spin.current += dt * (cityStore.get().active === "contact" ? 3 : 0.6);
    const obj = o.current;
    for (let i = 0; i < WALL_WHEELS; i++) {
      obj.position.set(-7.65 + i * 0.9, 1.35, 0.15);
      obj.rotation.set(0, spin.current + i * 0.7, 0);
      obj.updateMatrix();
      mesh.current.setMatrixAt(i, obj.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <Box size={[16, 0.9, 1.4]} position={[0, 0.45, 0]} color={WHITE} />
      <Box size={[16, 2.4, 0.3]} position={[0, 1.5, -0.55]} color={MAROON} />
      <instancedMesh ref={mesh} args={[undefined, undefined, WALL_WHEELS]} material={gold()} castShadow>
        <cylinderGeometry args={[0.27, 0.27, 0.8, 12]} />
      </instancedMesh>
      {[-8, -3.6, 0, 3.6, 8].map((x) => (
        <Box key={x} size={[0.18, 1.6, 0.18]} position={[x, 1.7, 0.62]} color={MAROON} />
      ))}
      <Box size={[16.6, 0.14, 1.7]} position={[0, 2.64, 0.05]} rotation={[0.28, 0, 0]} color="#7b3f22" />
      <Box size={[16.6, 0.12, 0.12]} position={[0, 2.43, 0.86]} color={PALETTE.gold} roughness={0.35} metalness={0.5} />
    </group>
  );
}
