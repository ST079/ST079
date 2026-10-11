"use client";

import { useEffect, useRef } from "react";

import {
  destinations,
  HILL,
  houses,
  ISLAND,
  LAKE,
  LAKE_HILLS,
  KIOSKS,
  LAKE_GROUNDS,
  LAKE_PATH,
  LAKE_PATH_HALF_WIDTH,
  LAKE_PATH_OFFSET,
  PLAYGROUND,
  STALLS,
  LANDMARKS,
  PAVED,
  ROAD,
  SWAYAMBHU_AREA,
  TOWN_AREA,
} from "../layout";
import { car, driveTo, driveToPoint, useCity } from "../store";

// The whole map, from the houses on the far side of Phewa Lake to the east end
// of Bhaktapur.
const MARGIN = LAKE_GROUNDS.far - LAKE_PATH_OFFSET + 12;
const MIN_X = Math.min(...LAKE_PATH.points.map(([x]) => x)) - MARGIN;
const MAX_X = TOWN_AREA[1] - 2;
const MIN_Z = Math.min(...LAKE_PATH.points.map(([, z]) => z)) - MARGIN;
const MAX_Z = Math.max(...LAKE_PATH.points.map(([, z]) => z)) + MARGIN;

// The window shown at a time, in world units: Swayambhunath to Bhaktapur fits.
const VIEW_W = MAX_X - (SWAYAMBHU_AREA[0] + 4);
const VIEW_H = TOWN_AREA[3] - 4 - (SWAYAMBHU_AREA[2] + 4);

const LAKE_POINTS = LAKE.map(([x, z]) => `${x},${z}`).join(" ");
const PATH_POINTS = LAKE_PATH.points.filter((_, i) => i % 4 === 0).map(([x, z]) => `${x.toFixed(1)},${z.toFixed(1)}`).join(" ");

/** Swayambhunath's square, Lakeside and the roads are stone, Bhaktapur's brick. */
const isStone = (area: (typeof PAVED)[number]) => area === ROAD || area[1] <= SWAYAMBHU_AREA[1];

/** Top-left corner of the window, centred on the car but kept inside the map. */
function viewAt(x: number, z: number) {
  return {
    x: Math.min(Math.max(x - VIEW_W / 2, MIN_X), MAX_X - VIEW_W),
    z: Math.min(Math.max(z - VIEW_H / 2, MIN_Z), MAX_Z - VIEW_H),
  };
}

/**
 * A small top-down map that pans to follow the car. Click a dot to go there,
 * or anywhere else to route to that point.
 */
export default function Minimap({ width }: { width: number }) {
  const svg = useRef<SVGSVGElement>(null);
  const marker = useRef<SVGGElement>(null);
  const view = useRef(viewAt(car.x, car.z));
  const active = useCity((s) => s.active);

  const height = Math.round((width * VIEW_H) / VIEW_W);
  // World units per pixel, so dots and lines keep their on-screen size.
  const u = VIEW_W / width;

  // Pan the window and move the car marker every frame without re-rendering.
  useEffect(() => {
    let frame = 0;
    const tick = () => {
      const v = viewAt(car.x, car.z);
      view.current = v;
      svg.current?.setAttribute("viewBox", `${v.x} ${v.z} ${VIEW_W} ${VIEW_H}`);
      const degrees = 180 - (car.heading * 180) / Math.PI;
      marker.current?.setAttribute("transform", `translate(${car.x} ${car.z}) rotate(${degrees}) scale(${u})`);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [u]);

  const onMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    driveToPoint(
      view.current.x + ((e.clientX - box.left) / box.width) * VIEW_W,
      view.current.z + ((e.clientY - box.top) / box.height) * VIEW_H,
    );
  };

  const rect = (center: [number, number], size: [number, number]) => ({
    x: center[0] - size[0] / 2,
    y: center[1] - size[1] / 2,
    width: size[0],
    height: size[1],
  });

  const start = viewAt(car.x, car.z);
  return (
    <div className="pointer-events-auto rounded-2xl bg-white/90 p-2 shadow-md ring-1 ring-black/5 backdrop-blur">
      <svg
        ref={svg}
        width={width}
        height={height}
        viewBox={`${start.x} ${start.z} ${VIEW_W} ${VIEW_H}`}
        className="cursor-crosshair rounded-xl"
        onClick={onMapClick}
        role="img"
        aria-label="Map of Bhaktapur Durbar Square, Swayambhunath and Pokhara"
      >
        <rect x={MIN_X - VIEW_W} y={MIN_Z - VIEW_H} width={(MAX_X - MIN_X) * 3} height={(MAX_Z - MIN_Z) * 3} fill="#cfdcb4" />
        {Object.values(LAKE_HILLS).map((h, i) => (
          <circle key={i} cx={h.center[0]} cy={h.center[1]} r={h.radius} fill="#b4c994" />
        ))}
        <polygon points={PATH_POINTS} fill="none" stroke="#d8cdb6" strokeWidth={LAKE_PATH_HALF_WIDTH * 2} strokeLinejoin="round" />
        <polygon points={LAKE_POINTS} fill="#8fc3dc" stroke="#6aa6c4" strokeWidth={u} />
        <circle cx={ISLAND.center[0]} cy={ISLAND.center[1]} r={ISLAND.radius} fill="#8fae6c" />
        {PAVED.map((area, i) => {
          const [x0, x1, z0, z1] = area;
          return <rect key={i} x={x0} y={z0} width={x1 - x0} height={z1 - z0} fill={isStone(area) ? "#d8cdb6" : "#d9a58a"} />;
        })}
        <circle cx={HILL.center[0]} cy={HILL.center[1]} r={HILL.radius} fill="#8fae6c" />
        <rect x={PLAYGROUND[0]} y={PLAYGROUND[2]} width={PLAYGROUND[1] - PLAYGROUND[0]} height={PLAYGROUND[3] - PLAYGROUND[2]} fill="#e6d3a3" />
        {[...KIOSKS, ...STALLS].map((k, i) => (
          <circle key={i} cx={k.at[0]} cy={k.at[1]} r={1.4} fill="#b5161f" />
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
            cx={d.spot[0]}
            cy={d.spot[1]}
            r={(active === d.id ? 6 : 4.5) * u}
            fill={d.color}
            stroke="#fff"
            strokeWidth={1.5 * u}
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
