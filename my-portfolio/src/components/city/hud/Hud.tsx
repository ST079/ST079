"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { LayoutList, Minus, Navigation, Plus, X } from "lucide-react";

import profile from "@/config/profile";
import { useMediaQuery } from "@/hooks/use-media-query";
import { destinationById, TOUR } from "../layout";
import { car, cityStore, driveTo, stopDriving, useCity, zoomBy } from "../store";
import DestinationBar from "./DestinationBar";
import Minimap from "./Minimap";
import Panel from "./Panel";

/** "Driving to Projects · 64 m" while the autopilot is on, with a stop button. */
function DrivingStatus() {
  const driving = useCity((s) => s.driving);
  const distance = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!driving) return;
    let frame = 0;
    const tick = () => {
      if (distance.current) distance.current.textContent = `${Math.max(0, Math.round(car.remaining))} m`;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [driving]);

  const label = driving && driving !== "point" ? destinationById[driving].section : "your pin";

  return (
    <AnimatePresence>
      {driving && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="pointer-events-auto absolute left-1/2 top-3 flex -translate-x-1/2 items-center gap-3 whitespace-nowrap rounded-full bg-white/95 py-1.5 pl-4 pr-1.5 text-sm shadow-md ring-1 ring-black/5 max-sm:top-[76px] sm:top-5"
        >
          <Navigation className="size-4 text-blue-600" aria-hidden />
          <span>
            Driving to <span className="font-semibold">{label}</span>
          </span>
          <span ref={distance} className="tabular-nums text-muted-foreground" />
          <button
            type="button"
            onClick={stopDriving}
            aria-label="Stop driving"
            className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex min-w-6 items-center justify-center rounded-md border bg-white px-1.5 py-0.5 font-sans text-[11px] font-medium text-foreground shadow-[0_1px_0_rgba(0,0,0,0.08)]">
      {children}
    </kbd>
  );
}

/** First-visit instructions; disappear after the first keyboard input. */
function ControlsHint() {
  const hasDriven = useCity((s) => s.hasDriven);
  const touch = useMediaQuery("(pointer: coarse)");

  return (
    <AnimatePresence>
      {!hasDriven && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.8 } }}
          exit={{ opacity: 0, y: 8 }}
          className="w-[186px] space-y-2 rounded-2xl bg-white/90 p-3 text-xs text-muted-foreground shadow-md ring-1 ring-black/5 backdrop-blur"
        >
          {touch ? (
            <p>Tap a place, a sign or the road and the car drives itself there.</p>
          ) : (
            <>
              <p className="flex flex-wrap items-center gap-1">
                <Key>W</Key>
                <Key>A</Key>
                <Key>S</Key>
                <Key>D</Key>
                <span className="ml-0.5">to drive</span>
              </p>
              <p className="flex items-center gap-1">
                <Key>Space</Key>
                <span className="ml-0.5">to brake</span>
              </p>
              <p>Or click a place, a sign or the road, and the car drives itself.</p>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PillButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex size-9 items-center justify-center rounded-full bg-white/90 text-foreground shadow-sm ring-1 ring-black/5 backdrop-blur transition-colors hover:bg-white"
    >
      {children}
    </button>
  );
}

/** Everything drawn over the 3D town. */
export default function Hud({ onExit }: { onExit: () => void }) {
  const wide = useMediaQuery("(min-width: 900px)");

  // Esc closes the panel, E re-opens it, 1-6 drive to a destination.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      const { active, dismissed } = cityStore.get();
      if (e.key === "Escape" && active && dismissed !== active) cityStore.set({ dismissed: active });
      if (e.code === "KeyE" && active && dismissed === active) cityStore.set({ dismissed: null });
      const n = Number(e.key);
      if (n >= 1 && n <= TOUR.length) driveTo(TOUR[n - 1]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {/* Identity */}
      <div className="absolute left-2 top-2 select-none rounded-2xl bg-white/90 px-4 py-2.5 shadow-sm ring-1 ring-black/5 backdrop-blur sm:left-5 sm:top-5">
        <p className="text-sm font-semibold sm:text-base">{profile.name}</p>
        <p className="text-xs text-muted-foreground sm:text-sm">
          {profile.role} at {profile.company}
        </p>
      </div>

      <DrivingStatus />

      {/* View controls */}
      <div className="pointer-events-auto absolute right-2 top-2 flex items-center gap-2 sm:right-5 sm:top-5">
        <div className="flex gap-2 max-sm:hidden">
          <PillButton label="Zoom in" onClick={() => zoomBy(0.8)}>
            <Plus className="size-4" />
          </PillButton>
          <PillButton label="Zoom out" onClick={() => zoomBy(1.25)}>
            <Minus className="size-4" />
          </PillButton>
        </div>
        <button
          type="button"
          onClick={onExit}
          className="flex h-9 items-center gap-2 rounded-full bg-white/90 px-3.5 text-sm font-medium shadow-sm ring-1 ring-black/5 backdrop-blur transition-colors hover:bg-white"
        >
          <LayoutList className="size-4" aria-hidden />
          <span className="max-sm:hidden">Classic view</span>
          <span className="sm:hidden">Classic</span>
        </button>
      </div>

      {wide && (
        <div className="absolute bottom-24 left-5 flex flex-col items-start gap-3">
          <ControlsHint />
          <Minimap size={176} />
        </div>
      )}

      <DestinationBar />
      <Panel />
    </div>
  );
}
