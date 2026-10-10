"use client";

import { useRef, useState, type ComponentType } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useCursor } from "@react-three/drei";
import * as THREE from "three";

import { destinations, SIDEWALK_HEIGHT, type Destination, type DestinationId } from "../layout";
import { cityStore, driveTo } from "../store";
import DataCenter from "./buildings/DataCenter";
import Home from "./buildings/Home";
import PostOffice from "./buildings/PostOffice";
import TechHub from "./buildings/TechHub";
import University from "./buildings/University";
import VeelHQ from "./buildings/VeelHQ";

const BUILDINGS: Record<DestinationId, ComponentType> = {
  about: Home,
  experience: VeelHQ,
  projects: DataCenter,
  skills: TechHub,
  education: University,
  contact: PostOffice,
};

const LOT_Y = SIDEWALK_HEIGHT + 0.04;

/** The painted parking spot on the road; it fills in while the car is parked there. */
function Spot({ d }: { d: Destination }) {
  const fill = useRef<THREE.MeshBasicMaterial>(null!);
  const ring = useRef<THREE.Mesh>(null!);

  useFrame((state, dt) => {
    const parked = cityStore.get().active === d.id;
    fill.current.opacity = THREE.MathUtils.damp(fill.current.opacity, parked ? 0.45 : 0.18, 5, dt);
    const pulse = parked ? 1 : 1 + Math.sin(state.clock.elapsedTime * 2.5) * 0.04;
    ring.current.scale.setScalar(pulse);
  });

  return (
    <group position={[d.spot[0], 0.05, d.spot[1]]} rotation-x={-Math.PI / 2}>
      <mesh>
        <circleGeometry args={[2.3, 40]} />
        <meshBasicMaterial ref={fill} color={d.color} transparent opacity={0.18} depthWrite={false} />
      </mesh>
      <mesh ref={ring}>
        <ringGeometry args={[2.1, 2.35, 48]} />
        <meshBasicMaterial color={d.color} transparent opacity={0.9} depthWrite={false} />
      </mesh>
    </group>
  );
}

function Place({ d }: { d: Destination }) {
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);
  const Building = BUILDINGS[d.id];

  const go = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    driveTo(d.id);
  };

  return (
    <>
      <group
        position={[d.center[0], LOT_Y, d.center[1]]}
        rotation-y={d.facing === "east" ? Math.PI / 2 : 0}
        onClick={go}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <Building />
      </group>

      <Spot d={d} />
    </>
  );
}

/** The six portfolio buildings and their parking spots (signs: see ../signs.tsx). */
export default function Destinations() {
  return (
    <>
      {destinations.map((d) => (
        <Place key={d.id} d={d} />
      ))}
    </>
  );
}
