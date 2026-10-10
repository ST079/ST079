"use client";

import { useEffect, useRef } from "react";

import { BLOCK_SIZE, BLOCKS, destinations, ROAD_SPAN, ROAD_WIDTH, ROADS } from "../layout";
import { car, driveTo, driveToPoint, useCity } from "../store";

const HALF = 47; // world units shown either side of the centre

/** A small top-down map. Click a dot to drive there, or anywhere to route to that road. */
export default function Minimap({ size }: { size: number }) {
  const marker = useRef<SVGGElement>(null);
  const route = useCity((s) => s.route);
  const active = useCity((s) => s.active);

  const scale = size / (HALF * 2);
  const at = (v: number) => (v + HALF) * scale;

  // Move the car marker every frame without re-rendering.
  useEffect(() => {
    let frame = 0;
    const tick = () => {
      const x = (car.x + HALF) * scale;
      const y = (car.z + HALF) * scale;
      const degrees = 180 - (car.heading * 180) / Math.PI;
      marker.current?.setAttribute("transform", `translate(${x} ${y}) rotate(${degrees})`);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [scale]);

  const onMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    driveToPoint(((e.clientX - box.left) / box.width) * HALF * 2 - HALF, ((e.clientY - box.top) / box.height) * HALF * 2 - HALF);
  };

  return (
    <div className="pointer-events-auto rounded-2xl bg-white/90 p-2 shadow-md ring-1 ring-black/5 backdrop-blur">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="cursor-crosshair rounded-xl"
        onClick={onMapClick}
        role="img"
        aria-label="Town map"
      >
        <rect width={size} height={size} fill="#dcebcf" />
        {BLOCKS.map(([x, z]) => (
          <rect
            key={`${x},${z}`}
            x={at(x - BLOCK_SIZE / 2)}
            y={at(z - BLOCK_SIZE / 2)}
            width={BLOCK_SIZE * scale}
            height={BLOCK_SIZE * scale}
            fill="#c5dcb2"
          />
        ))}
        {ROADS.map((r) => (
          <g key={r} fill="#b9c0ca">
            <rect x={at(-ROAD_SPAN / 2)} y={at(r - ROAD_WIDTH / 2)} width={ROAD_SPAN * scale} height={ROAD_WIDTH * scale} />
            <rect x={at(r - ROAD_WIDTH / 2)} y={at(-ROAD_SPAN / 2)} width={ROAD_WIDTH * scale} height={ROAD_SPAN * scale} />
          </g>
        ))}
        {route && (
          <polyline
            points={route.map(([x, z]) => `${at(x)},${at(z)}`).join(" ")}
            fill="none"
            stroke="#2563eb"
            strokeWidth={2.5}
            strokeLinejoin="round"
          />
        )}
        {destinations.map((d) => (
          <circle
            key={d.id}
            cx={at(d.spot[0])}
            cy={at(d.spot[1])}
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
          <path d="M0 -6 L4.5 5 L0 2.6 L-4.5 5 Z" fill="#e63946" stroke="#fff" strokeWidth={1.2} strokeLinejoin="round" />
        </g>
      </svg>
    </div>
  );
}
