"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CarFront, Check, LayoutList, Minus, Navigation, Plus, X } from "lucide-react";

import profile from "@/config/profile";
import { useMediaQuery } from "@/hooks/use-media-query";
import { destinationById, TOUR } from "../layout";
import { VEHICLES } from "../scene/vehicles";
import { car, chooseVehicle, cityStore, driveTo, stopDriving, useCity, zoomBy } from "../store";
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

  const label = driving && driving !== "point" ? destinationById[driving].place : "your pin";

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

/** First view: the town itself, with a short welcome until the visitor gets going. */
function Welcome() {
  const started = useCity((s) => s.started);
  const touch = useMediaQuery("(pointer: coarse)");
  const [closed, setClosed] = useState(false);

  return (
    <AnimatePresence>
      {!started && !closed && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.9, duration: 0.5 } }}
          exit={{ opacity: 0, y: -10 }}
          className="pointer-events-auto absolute inset-x-2 top-[72px] rounded-2xl bg-white/95 p-4 shadow-lg ring-1 ring-black/5 backdrop-blur sm:inset-x-auto sm:left-1/2 sm:top-5 sm:w-[440px] sm:-translate-x-1/2"
        >
          <button
            type="button"
            onClick={() => setClosed(true)}
            aria-label="Close"
            className="absolute right-2 top-2 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
          <p className="pr-6 text-base font-semibold">Namaste, welcome to Bhaktapur.</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            My portfolio is a drive through Durbar Square. Each landmark holds a part of it: pick one
            below and the car takes you there{touch ? "." : ", or drive yourself."}
          </p>
          {!touch && (
            <p className="mt-3 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
              <Key>W</Key>
              <Key>A</Key>
              <Key>S</Key>
              <Key>D</Key>
              <span className="mr-2">drive</span>
              <Key>Space</Key>
              <span className="mr-2">brake</span>
              <Key>1</Key>–<Key>6</Key>
              <span>places</span>
            </p>
          )}
          <button
            type="button"
            onClick={(e) => {
              driveTo(TOUR[0]);
              e.currentTarget.blur();
            }}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-85"
          >
            Start the tour
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Pick which car to drive. */
function Garage() {
  const vehicle = useCity((s) => s.vehicle);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !root.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", close);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={(e) => {
          setOpen((o) => !o);
          e.currentTarget.blur();
        }}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex h-9 items-center gap-2 rounded-full bg-white/90 px-3.5 text-sm font-medium shadow-sm ring-1 ring-black/5 backdrop-blur transition-colors hover:bg-white"
      >
        <CarFront className="size-4" aria-hidden />
        <span className="max-sm:hidden">Garage</span>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-11 w-56 rounded-2xl bg-white p-1.5 shadow-xl ring-1 ring-black/5">
          <p className="px-2.5 pb-1 pt-1.5 text-xs text-muted-foreground">Choose your ride</p>
          {VEHICLES.map((v) => (
            <button
              key={v.id}
              type="button"
              role="menuitemradio"
              aria-checked={vehicle === v.id}
              onClick={(e) => {
                chooseVehicle(v.id);
                setOpen(false);
                e.currentTarget.blur();
              }}
              className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-sm transition-colors hover:bg-muted"
            >
              <span className="size-5 rounded-full ring-1 ring-black/10" style={{ background: v.color }} />
              <span className="flex-1 text-left font-medium">{v.name}</span>
              {vehicle === v.id && <Check className="size-4" aria-hidden />}
            </button>
          ))}
        </div>
      )}
    </div>
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

      <Welcome />
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
        <Garage />
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
        <div className="absolute bottom-24 left-5">
          <Minimap width={176} />
        </div>
      )}

      <DestinationBar />
      <Panel />
    </div>
  );
}
