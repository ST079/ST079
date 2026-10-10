"use client";

import { useEffect } from "react";
import { useFrame } from "@react-three/fiber";

import { townSound } from "../audio";
import { destinationById, SWAYAMBHU_AREA } from "../layout";
import { car, cityStore } from "../store";

/**
 * Feeds the car's speed and whereabouts to the town's sound every frame.
 * Audio starts on the visitor's first click, tap or key press (browsers
 * don't allow it sooner), pauses while the tab is hidden, and stops when the
 * town is left.
 */
export default function CitySound() {
  useEffect(() => {
    const start = () => townSound.start();
    const onVisibility = () => townSound.suspend(document.hidden);
    const events = ["pointerdown", "keydown", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, start, { passive: true }));
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      events.forEach((e) => window.removeEventListener(e, start));
      document.removeEventListener("visibilitychange", onVisibility);
      townSound.stop();
    };
  }, []);

  useFrame((_, dt) => {
    const { vehicle, active } = cityStore.get();
    const area = active ? destinationById[active].area : null;
    townSound.update(car.speed, vehicle, Math.min(dt, 1 / 20), active, area, car.x < SWAYAMBHU_AREA[1]);
  });

  return null;
}
