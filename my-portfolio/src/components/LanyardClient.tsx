"use client";

import Lanyard from "@/components/Lanyard";
import siteConfig from "@/src/config/siteConfig";

export default function LanyardClient() {
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