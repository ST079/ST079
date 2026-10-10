"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { GATE_GUARDS } from "../../layout";
import { Box, mat } from "../parts";

// Two Nepal Army soldiers standing guard at the Golden Gate, as at the real
// one: olive uniforms, dark berets, rifles grounded at their right side
// ("order arms"). Modelled facing +z with their feet at y = 0, so a soldier's
// right hand is on the -x side.

const UNIFORM = "#56613a";
const TROUSERS = "#4b5530";
const BERET = "#1d2b1d";
const SKIN = "#b97a4a";
const BOOTS = "#1a1a1a";
const WOOD = "#5b3a21";
const STEEL = "#2a2d30";

/** A rifle stood upright, butt on the ground (local +y up, front +z). */
function Rifle() {
  return (
    <group>
      <Box size={[0.06, 0.3, 0.11]} position={[0, 0.15, 0]} color={WOOD} />
      <Box size={[0.065, 0.34, 0.09]} position={[0, 0.47, 0]} color={STEEL} />
      {/* Magazine, curving forwards */}
      <Box size={[0.05, 0.2, 0.07]} position={[0, 0.48, 0.08]} rotation={[0.25, 0, 0]} color={STEEL} />
      <Box size={[0.06, 0.32, 0.08]} position={[0, 0.8, 0]} color={WOOD} />
      <mesh position={[0, 1.08, 0]} material={mat(STEEL, 0.5, 0.4)} castShadow>
        <cylinderGeometry args={[0.014, 0.014, 0.32, 8]} />
      </mesh>
      <Box size={[0.02, 0.05, 0.02]} position={[0, 1.18, 0.02]} color={STEEL} />
    </group>
  );
}

/** A soldier at attention, rifle at order arms. `phase` staggers their breathing. */
function Soldier({ phase = 0 }: { phase?: number }) {
  const chest = useRef<THREE.Group>(null!);

  // Standing still, just breathing.
  useFrame(({ clock }) => {
    chest.current.scale.y = 1 + Math.sin(clock.elapsedTime * 1.5 + phase) * 0.012;
  });

  return (
    <group>
      {/* Boots and legs */}
      {[-0.11, 0.11].map((x) => (
        <group key={x}>
          <Box size={[0.16, 0.16, 0.3]} position={[x, 0.08, 0.04]} color={BOOTS} />
          <Box size={[0.17, 0.7, 0.19]} position={[x, 0.51, 0]} color={TROUSERS} />
        </group>
      ))}
      <Box size={[0.48, 0.09, 0.28]} position={[0, 0.9, 0]} color="#2b2b23" />

      <group ref={chest} position-y={0.9}>
        {/* Torso, with pockets and shoulder flashes */}
        <Box size={[0.46, 0.58, 0.26]} position={[0, 0.3, 0]} color={UNIFORM} />
        {[-0.11, 0.11].map((x) => (
          <Box key={x} size={[0.12, 0.1, 0.02]} position={[x, 0.42, 0.135]} color={TROUSERS} />
        ))}
        {[-0.25, 0.25].map((x) => (
          <Box key={x} size={[0.04, 0.08, 0.1]} position={[x, 0.5, 0]} color="#a23232" />
        ))}
        {/* Left arm at the side */}
        <Box size={[0.12, 0.58, 0.14]} position={[0.3, 0.27, 0]} color={UNIFORM} />
        <Box size={[0.1, 0.1, 0.1]} position={[0.3, -0.05, 0]} color={SKIN} />
        {/* Right arm down and a little forward, hand on the rifle */}
        <Box size={[0.12, 0.56, 0.14]} position={[-0.31, 0.28, 0.03]} rotation={[-0.12, 0, 0]} color={UNIFORM} />
        <Box size={[0.1, 0.1, 0.1]} position={[-0.34, 0.0, 0.09]} color={SKIN} />
        {/* Neck, head, and the beret pulled down over the right ear, badge over the left eye */}
        <mesh position={[0, 0.65, 0]} material={mat(SKIN)} castShadow>
          <cylinderGeometry args={[0.06, 0.07, 0.1, 10]} />
        </mesh>
        <mesh position={[0, 0.8, 0]} material={mat(SKIN)} castShadow>
          <sphereGeometry args={[0.12, 14, 10]} />
        </mesh>
        <mesh position={[-0.02, 0.9, -0.01]} rotation={[0, 0, 0.25]} scale={[1.18, 0.45, 1.12]} material={mat(BERET)} castShadow>
          <sphereGeometry args={[0.13, 14, 10]} />
        </mesh>
        <Box size={[0.04, 0.05, 0.02]} position={[0.05, 0.92, 0.13]} color="#d4a52a" metalness={0.6} roughness={0.35} />
      </group>

      {/* The rifle, grounded by the right foot */}
      <group position={[-0.4, 0, 0.1]}>
        <Rifle />
      </group>
    </group>
  );
}

/** The two guards flanking the Golden Gate, facing the square. */
export default function GateGuards() {
  return (
    <>
      {GATE_GUARDS.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <Soldier phase={i * 1.7} />
        </group>
      ))}
    </>
  );
}
