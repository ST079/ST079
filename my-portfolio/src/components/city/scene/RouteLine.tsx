"use client";

import { useMemo } from "react";
import { Line } from "@react-three/drei";

import { useCity } from "../store";

/** The planned route, drawn on the road like a navigation app's blue line. */
export default function RouteLine() {
  const route = useCity((s) => s.route);
  const points = useMemo(
    () => route?.map(([x, z]) => [x, 0.09, z] as [number, number, number]) ?? null,
    [route],
  );

  if (!points || points.length < 2) return null;
  const end = points[points.length - 1];

  return (
    <>
      {/* White casing first, then the blue line on top of it */}
      <Line points={points} color="#ffffff" lineWidth={9} renderOrder={1} />
      <Line points={points} color="#2563eb" lineWidth={5} renderOrder={2} />
      <mesh position={[end[0], 0.1, end[2]]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.6, 24]} />
        <meshBasicMaterial color="#2563eb" />
      </mesh>
    </>
  );
}
