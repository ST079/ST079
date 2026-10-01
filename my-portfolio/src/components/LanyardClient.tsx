"use client";

import Lanyard from "@/components/Lanyard";
import frontImage from "@/src/assets/lanyard/frontEnhanded.png";
import backImage from "@/src/assets/lanyard/backEnhanced.png";

export default function LanyardClient() {
  return (
    <Lanyard
      position={[0, 0, 20]}
      gravity={[0, -40, 0]}
      lanyardWidth={0.5}
      frontImage={frontImage.src}
      backImage={backImage.src}
    />
  );
}