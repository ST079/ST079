"use client";

import { useRef, useState, type ComponentType } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useCursor } from "@react-three/drei";
import * as THREE from "three";

import { destinations, LANDMARKS, type Destination, type DestinationId, type Solid } from "../layout";
import { cityStore, driveTo } from "../store";
import GoldenGate from "./buildings/GoldenGate";
import NewaHome from "./buildings/NewaHome";
import Nyatapola from "./buildings/Nyatapola";
import Palace from "./buildings/Palace";
import TalejuBell from "./buildings/TalejuBell";
import Vatsala from "./buildings/Vatsala";

// Each destination's landmark, where it stands, and which way its front faces
// (buildings are modelled facing +z; rotations turn them towards their spot).
const BUILDINGS: Record<DestinationId, { Model: ComponentType; solid: Solid; rotation: number }> = {
  about: { Model: NewaHome, solid: LANDMARKS.home, rotation: Math.PI / 2 }, // faces east
  experience: { Model: Palace, solid: LANDMARKS.palace, rotation: 0 }, // faces south
  projects: { Model: Nyatapola, solid: LANDMARKS.nyatapola, rotation: -Math.PI / 2 }, // faces west
  skills: { Model: Vatsala, solid: LANDMARKS.vatsala, rotation: -Math.PI / 2 }, // faces west
  education: { Model: GoldenGate, solid: LANDMARKS.goldenGate, rotation: 0 }, // faces south
  contact: { Model: TalejuBell, solid: LANDMARKS.bell, rotation: Math.PI / 2 }, // faces east
};

/** A soft painted circle where the car parks; it brightens while parked there. */
function Spot({ d }: { d: Destination }) {
  const fill = useRef<THREE.MeshBasicMaterial>(null!);

  useFrame((_, dt) => {
    const parked = cityStore.get().active === d.id;
    fill.current.opacity = THREE.MathUtils.damp(fill.current.opacity, parked ? 0.4 : 0.16, 5, dt);
  });

  return (
    <group position={[d.spot[0], 0.03, d.spot[1]]} rotation-x={-Math.PI / 2}>
      <mesh>
        <circleGeometry args={[2.4, 40]} />
        <meshBasicMaterial ref={fill} color={d.color} transparent opacity={0.16} depthWrite={false} />
      </mesh>
      <mesh>
        <ringGeometry args={[2.25, 2.45, 48]} />
        <meshBasicMaterial color={d.color} transparent opacity={0.7} depthWrite={false} />
      </mesh>
    </group>
  );
}

function Place({ d }: { d: Destination }) {
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);
  const { Model, solid, rotation } = BUILDINGS[d.id];

  const go = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    driveTo(d.id);
  };

  return (
    <>
      <group
        position={[solid.center[0], 0, solid.center[1]]}
        rotation-y={rotation}
        onClick={go}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <Model />
      </group>
      <Spot d={d} />
    </>
  );
}

/** The six portfolio landmarks and their parking spots (signs: see ../signs.tsx). */
export default function Destinations() {
  return (
    <>
      {destinations.map((d) => (
        <Place key={d.id} d={d} />
      ))}
    </>
  );
}
