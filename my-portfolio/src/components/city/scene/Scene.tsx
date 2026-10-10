"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { SignTracker } from "../signs";
import { car } from "../store";
import Monuments from "./buildings/Monuments";
import CameraRig from "./CameraRig";
import Car from "./Car";
import Destinations from "./Destinations";
import Environment from "./Environment";
import Houses from "./Houses";
import Npcs from "./Npcs";
import { PALETTE } from "./parts";

// The sun sits south-west and high; its shadow box follows the car.
const SUN_OFFSET = new THREE.Vector3(-30, 55, 35);

function Sun({ shadowSize }: { shadowSize: number }) {
  const light = useRef<THREE.DirectionalLight>(null!);

  useFrame(() => {
    light.current.position.set(car.x + SUN_OFFSET.x, SUN_OFFSET.y, car.z + SUN_OFFSET.z);
    light.current.target.position.set(car.x, 0, car.z);
    light.current.target.updateMatrixWorld();
  });

  return (
    <directionalLight
      ref={light}
      castShadow
      intensity={2.5}
      color="#ffe6c7"
      shadow-mapSize={[shadowSize, shadowSize]}
      shadow-camera-left={-48}
      shadow-camera-right={48}
      shadow-camera-top={48}
      shadow-camera-bottom={-48}
      shadow-camera-near={10}
      shadow-camera-far={160}
      shadow-bias={-0.0004}
      shadow-normalBias={0.05}
    />
  );
}

interface SceneProps {
  /** False while the intro overlay is still up; the camera holds an aerial view. */
  ready: boolean;
  /** Shadow map resolution: lower on phones. */
  shadowSize: number;
}

/** Bhaktapur Durbar Square, Taumadhi and Swayambhunath, on a clear afternoon. */
export default function Scene({ ready, shadowSize }: SceneProps) {
  return (
    <>
      <fog attach="fog" args={[PALETTE.haze, 70, 260]} />
      <hemisphereLight args={["#e6eef6", "#a3b974", 1.45]} />
      <Sun shadowSize={shadowSize} />

      <Environment />
      <Houses />
      <Monuments />
      <Destinations />
      <Npcs />
      <Car />
      <CameraRig ready={ready} />
      {/* After the camera rig, so signs follow this frame's camera */}
      <SignTracker />
    </>
  );
}
