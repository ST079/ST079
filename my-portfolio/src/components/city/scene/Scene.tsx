"use client";

import { SignTracker } from "../signs";
import CameraRig from "./CameraRig";
import Car from "./Car";
import Destinations from "./Destinations";
import Ground from "./Ground";
import RouteLine from "./RouteLine";
import Scenery from "./Scenery";
import Trees from "./Trees";
import { PALETTE } from "./parts";

interface SceneProps {
  /** False while the intro overlay is still up; the camera waits above the town. */
  ready: boolean;
  /** Shadow map resolution: lower on phones. */
  shadowSize: number;
}

/** A bright, daytime miniature town. */
export default function Scene({ ready, shadowSize }: SceneProps) {
  return (
    <>
      <color attach="background" args={[PALETTE.sky]} />
      <fog attach="fog" args={[PALETTE.sky, 95, 190]} />

      <hemisphereLight args={["#ffffff", "#c9dcb5", 1.6]} />
      <directionalLight
        castShadow
        position={[30, 60, 22]}
        intensity={2.4}
        color="#fff3e2"
        shadow-mapSize={[shadowSize, shadowSize]}
        shadow-camera-left={-58}
        shadow-camera-right={58}
        shadow-camera-top={58}
        shadow-camera-bottom={-58}
        shadow-camera-near={10}
        shadow-camera-far={170}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
      />

      <Ground />
      <Trees />
      <Scenery />
      <Destinations />
      <RouteLine />
      <Car />
      <CameraRig ready={ready} />
      {/* After the camera rig, so signs follow this frame's camera */}
      <SignTracker />
    </>
  );
}
