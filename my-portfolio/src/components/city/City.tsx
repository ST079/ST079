"use client";

import { useEffect } from "react";
import { Canvas } from "@react-three/fiber";

import { useIntroDone } from "@/components/intro/IntroGate";
import { useMediaQuery } from "@/hooks/use-media-query";
import Hud from "./hud/Hud";
import Scene from "./scene/Scene";
import { PALETTE } from "./scene/parts";
import { Signs } from "./signs";
import { restoreVehicle } from "./store";

/**
 * The portfolio as a drive through Bhaktapur Durbar Square. Each landmark is
 * a section; park at one (or pick it in the "Where to?" bar) to read it.
 * Loaded client-side only, see ViewModeShell.
 */
export default function City({ onExit }: { onExit: () => void }) {
  const ready = useIntroDone();
  const desktop = useMediaQuery("(pointer: fine) and (min-width: 900px)");

  // Bring back the car the visitor picked last time.
  useEffect(restoreVehicle, []);

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden text-foreground" style={{ background: PALETTE.haze }}>
      <div className="absolute inset-0 touch-none">
        <Canvas
          shadows
          flat
          dpr={desktop ? [1, 1.75] : [1, 1.5]}
          camera={{ position: [58, 62, 92], fov: 52, near: 0.5, far: 1400 }}
        >
          <Scene ready={ready} shadowSize={desktop ? 2048 : 1024} />
        </Canvas>
      </div>

      <Signs />
      <Hud onExit={onExit} />
    </div>
  );
}
