"use client";

import { LANDMARKS, type Solid } from "../../layout";
import { Box, Frustum, mat, PALETTE } from "../parts";
import { Guardian, PagodaTiers, Pinnacle } from "./pagoda";
import { GalleryWing, GateWall } from "./Palace";

/** Two-tiered pagoda on a low plinth. */
function Pashupatinath() {
  return (
    <group>
      <Box size={[7, 0.6, 7]} position={[0, 0.3, 0]} color={PALETTE.stone} />
      <Box size={[6, 0.6, 6]} position={[0, 0.9, 0]} color={PALETTE.stoneDark} />
      <Box size={[4.2, 3, 4.2]} position={[0, 2.7, 0]} color={PALETTE.brick} />
      {[0, Math.PI / 2, Math.PI, -Math.PI / 2].map((r) => (
        <group key={r} rotation-y={r}>
          <Box size={[1.1, 1.8, 0.1]} position={[0, 2.1, 2.12]} color={PALETTE.wood} />
        </group>
      ))}
      <PagodaTiers y={4.2} wall={4.2} count={2} shrink={1} overhang={2.6} roofHeight={1.6} gap={1.4} />
    </group>
  );
}

/** Chyasilin Mandap: an open octagonal pavilion with a two-tier roof. */
function Chyasilin() {
  const columns = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    return [Math.cos(a) * 2.7, Math.sin(a) * 2.7] as [number, number];
  });
  return (
    <group>
      <Frustum sides={8} bottom={8} top={7.4} height={0.8} position={[0, 0.4, 0]} color={PALETTE.stone} />
      <Frustum sides={8} bottom={6.6} top={6.3} height={0.5} position={[0, 1.05, 0]} color={PALETTE.stoneDark} />
      {columns.map(([x, z], i) => (
        <mesh key={i} position={[x, 2.7, z]} material={mat(PALETTE.woodLight)} castShadow>
          <cylinderGeometry args={[0.13, 0.15, 2.8, 8]} />
        </mesh>
      ))}
      <mesh position-y={2.7} material={mat(PALETTE.wood)} castShadow>
        <cylinderGeometry args={[1.2, 1.2, 2.8, 8]} />
      </mesh>
      <Frustum sides={8} bottom={8.6} top={3.4} height={1.4} position={[0, 4.8, 0]} color={PALETTE.tile} />
      <mesh position-y={6} material={mat(PALETTE.woodLight)} castShadow>
        <cylinderGeometry args={[1.5, 1.5, 1, 8]} />
      </mesh>
      <Frustum sides={8} bottom={5} top={0.6} height={1.6} position={[0, 7.3, 0]} color={PALETTE.tile} />
      <Pinnacle y={8.1} scale={0.7} />
    </group>
  );
}

/** Fasidega: a white temple on a tall stepped plinth, elephants on the stairs. */
function Fasidega() {
  const levels = [8, 7, 6.1, 5.3, 4.6, 4];
  const step = 0.8;
  const top = levels.length * step;
  return (
    <group>
      {levels.map((size, i) => (
        <Box key={size} size={[size, step, size]} position={[0, step * (i + 0.5), 0]} color={PALETTE.plaster} />
      ))}
      {Array.from({ length: 6 }, (_, i) => {
        const depth = (5.4 - 2) / 6;
        const h = (i + 1) * step;
        return <Box key={i} size={[1.6, h, depth]} position={[0, h / 2, 5.4 - (i + 0.5) * depth]} color="#e3d9c6" />;
      })}
      {[1, 3].map((i) => (
        <group key={i}>
          {[-1.2, 1.2].map((x) => (
            <Guardian key={x} position={[x, step * (i + 1), levels[i] / 2 - 0.4]} scale={1.15} />
          ))}
        </group>
      ))}
      <Box size={[3.2, 2.6, 3.2]} position={[0, top + 1.3, 0]} color="#f6f1e6" />
      <mesh position-y={top + 2.6} material={mat("#f6f1e6")} castShadow>
        <sphereGeometry args={[1.8, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <Pinnacle y={top + 4.3} scale={0.7} />
    </group>
  );
}

/** Bhairabnath: a broad, three-tiered rectangular pagoda. */
function Bhairabnath() {
  return (
    <group>
      <Box size={[10, 0.6, 7]} position={[0, 0.3, 0]} color={PALETTE.stone} />
      <Box size={[9, 3.4, 5.8]} position={[0, 2.3, 0]} color={PALETTE.brick} />
      {[-2.6, 0, 2.6].map((x) => (
        <Box key={x} size={[1.3, 2.2, 0.12]} position={[x, 1.75, 2.95]} color={PALETTE.wood} />
      ))}
      <mesh position={[0, 3.25, 3]} rotation-x={Math.PI / 2} material={mat(PALETTE.gold, 0.35, 0.6)}>
        <cylinderGeometry args={[0.9, 0.9, 0.2, 20, 1, false, Math.PI / 2, Math.PI]} />
      </mesh>
      <PagodaTiers y={4} wall={9} count={3} shrink={2} overhang={2.4} roofHeight={1.5} gap={1.3} aspect={0.62} />
    </group>
  );
}

/** King Bhupatindra Malla, kneeling in gold on a stone column, facing the palace. */
function MallaColumn() {
  const gold = mat(PALETTE.gold, 0.35, 0.6);
  return (
    <group>
      <Box size={[1.6, 0.8, 1.6]} position={[0, 0.4, 0]} color={PALETTE.stone} />
      <mesh position-y={4.2} material={mat(PALETTE.stone)} castShadow>
        <cylinderGeometry args={[0.3, 0.38, 6.8, 12]} />
      </mesh>
      <Box size={[1, 0.4, 1]} position={[0, 7.8, 0]} color={PALETTE.stoneDark} />
      <mesh position={[0, 8.35, 0]} material={gold} castShadow>
        <boxGeometry args={[0.55, 0.7, 0.45]} />
      </mesh>
      <mesh position={[0, 8.9, 0.05]} material={gold} castShadow>
        <sphereGeometry args={[0.2, 10, 8]} />
      </mesh>
      <mesh position-y={9.6} material={gold} castShadow>
        <coneGeometry args={[0.5, 0.35, 12]} />
      </mesh>
      <mesh position-y={9.2} material={gold}>
        <cylinderGeometry args={[0.03, 0.03, 0.8, 6]} />
      </mesh>
    </group>
  );
}

function Place({ solid, rotation = 0, children }: { solid: Solid; rotation?: number; children: React.ReactNode }) {
  return (
    <group position={[solid.center[0], 0, solid.center[1]]} rotation-y={rotation}>
      {children}
    </group>
  );
}

/** Temples and palace wings that aren't destinations. */
export default function Monuments() {
  return (
    <>
      <Place solid={LANDMARKS.pashupati}>
        <Pashupatinath />
      </Place>
      <Place solid={LANDMARKS.chyasilin}>
        <Chyasilin />
      </Place>
      <Place solid={LANDMARKS.fasidega}>
        <Fasidega />
      </Place>
      <Place solid={LANDMARKS.bhairabnath}>
        <Bhairabnath />
      </Place>
      <Place solid={LANDMARKS.column} rotation={Math.PI}>
        <MallaColumn />
      </Place>
      <Place solid={LANDMARKS.gallery}>
        <GalleryWing />
      </Place>
      <Place solid={LANDMARKS.gateWall}>
        <GateWall size={LANDMARKS.gateWall.size as [number, number]} />
      </Place>
    </>
  );
}
