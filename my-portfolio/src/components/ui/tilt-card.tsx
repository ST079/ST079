"use client";

import { useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Tilts a few degrees towards the mouse and lights up where the pointer is.
 * Mouse only (no effect on touch), and nothing at all with reduced motion.
 * Transform-only, so hovering never shifts the layout.
 */
export default function TiltCard({
  children,
  className,
  glow = "rgba(15, 23, 42, 0.08)",
  maxTilt = 5,
}: {
  children: ReactNode;
  className?: string;
  /** Colour of the spotlight that follows the pointer. */
  glow?: string;
  /** Maximum tilt in degrees. */
  maxTilt?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--spot-x", `${x * 100}%`);
    el.style.setProperty("--spot-y", `${y * 100}%`);
    el.style.transform = `perspective(900px) rotateX(${(0.5 - y) * maxTilt}deg) rotateY(${(x - 0.5) * maxTilt}deg)`;
  };

  const onPointerLeave = () => {
    if (ref.current) ref.current.style.transform = "";
  };

  return (
    <div
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className={cn("group/tilt relative h-full transition-transform duration-200 ease-out", className)}
    >
      {children}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-200 group-hover/tilt:opacity-100"
        style={{ background: `radial-gradient(420px circle at var(--spot-x, 50%) var(--spot-y, 50%), ${glow}, transparent 45%)` }}
      />
    </div>
  );
}
