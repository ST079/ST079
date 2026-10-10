"use client";

import { useEffect, useRef } from "react";

import { destinations, houses, LANDMARKS, PAVED } from "../layout";
import { car, driveTo, driveToPoint, useCity } from "../store";

// World area shown on the map.
const MIN_X = -58;
const MAX_X = 92;
const MIN_Z = -36;
const MAX_Z = 92;

/** A small top-down map. Click a dot to drive there, or anywhere to route to that point. */
export default function Minimap({ width }: { width: number }) {
  const marker = useRef<SVGGElement>(null);
  const active = useCity((s) => s.active);

  const scale = width / (MAX_X - MIN_X);
  const height = (MAX_Z - MIN_Z) * scale;
  const px = (x: number) => (x - MIN_X) * scale;
  const pz = (z: number) => (z - MIN_Z) * scale;

  // Move the car marker every frame without re-rendering.
  useEffect(() => {
    let frame = 0;
    const tick = () => {
      const x = (car.x - MIN_X) * scale;
      const y = (car.z - MIN_Z) * scale;
      const degrees = 180 - (car.heading * 180) / Math.PI;
      marker.current?.setAttribute("transform", `translate(${x} ${y}) rotate(${degrees})`);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [scale]);

  const onMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    driveToPoint(
      MIN_X + ((e.clientX - box.left) / box.width) * (MAX_X - MIN_X),
      MIN_Z + ((e.clientY - box.top) / box.height) * (MAX_Z - MIN_Z),
    );
  };

  const rect = (center: [number, number], size: [number, number]) => ({
    x: px(center[0] - size[0] / 2),
    y: pz(center[1] - size[1] / 2),
    width: size[0] * scale,
    height: size[1] * scale,
  });

  return (
    <div className="pointer-events-auto rounded-2xl bg-white/90 p-2 shadow-md ring-1 ring-black/5 backdrop-blur">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="cursor-crosshair rounded-xl"
        onClick={onMapClick}
        role="img"
        aria-label="Map of Durbar Square and Taumadhi"
      >
        <rect width={width} height={height} fill="#cfdcb4" />
        {PAVED.map(([x0, x1, z0, z1], i) => (
          <rect key={i} x={px(x0)} y={pz(z0)} width={(x1 - x0) * scale} height={(z1 - z0) * scale} fill="#d9a58a" />
        ))}
        {houses.map((h, i) => (
          <rect key={i} {...rect(h.center, h.size)} fill="#9c5a44" />
        ))}
        {Object.values(LANDMARKS).map((l, i) => (
          <rect key={i} {...rect(l.center, l.size)} fill="#6b3a2a" />
        ))}
        {destinations.map((d) => (
          <circle
            key={d.id}
            cx={px(d.spot[0])}
            cy={pz(d.spot[1])}
            r={active === d.id ? 6 : 4.5}
            fill={d.color}
            stroke="#fff"
            strokeWidth={1.5}
            className="cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              driveTo(d.id);
            }}
          >
            <title>{`${d.section} · ${d.place}`}</title>
          </circle>
        ))}
        <g ref={marker}>
          <path d="M0 -6 L4.5 5 L0 2.6 L-4.5 5 Z" fill="#1f2937" stroke="#fff" strokeWidth={1.2} strokeLinejoin="round" />
        </g>
      </svg>
    </div>
  );
}
