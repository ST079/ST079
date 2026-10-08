"use client";

import dynamic from "next/dynamic";

import siteConfig from "@/config/site";
import { useMediaQuery } from "@/hooks/use-media-query";

// three.js + rapier are large: load them in a separate client-only chunk.
const Lanyard = dynamic(() => import("./Lanyard"), { ssr: false });

/** The 3D badge. Only mounted on large screens, where the hero has room for it. */
export default function LanyardClient() {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  if (!isDesktop) return null;

  return (
    <Lanyard
      position={[0, 0, 20]}
      gravity={[0, -40, 0]}
      lanyardWidth={0.5}
      frontImage={siteConfig.lanyard.frontImage}
      backImage={siteConfig.lanyard.backImage}
    />
  );
}
