"use client";

import { Canvas } from "@react-three/fiber";

import { useIntroDone } from "@/components/intro/IntroGate";
import { useMediaQuery } from "@/hooks/use-media-query";
import Hud from "./hud/Hud";
import Scene from "./scene/Scene";
import { PALETTE } from "./scene/parts";
import { Signs } from "./signs";

/**
 * The portfolio as a small town you drive around. Each building is a section;
 * park at one (or pick it in the "Where to?" bar) to read it.
 * Loaded client-side only, see ViewModeShell.
 */
export default function City({ onExit }: { onExit: () => void }) {
  const ready = useIntroDone();
  const desktop = useMediaQuery("(pointer: fine) and (min-width: 900px)");

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden text-foreground" style={{ background: PALETTE.sky }}>
      <div className="absolute inset-0 touch-none">
        <Canvas
          shadows
          flat
          dpr={desktop ? [1, 1.75] : [1, 1.5]}
          camera={{ position: [40, 80, 95], fov: 35, near: 1, far: 400 }}
        >
          <Scene ready={ready} shadowSize={desktop ? 2048 : 1024} />
        </Canvas>
      </div>

      <Signs />
      <Hud onExit={onExit} />
    </div>
  );
}
