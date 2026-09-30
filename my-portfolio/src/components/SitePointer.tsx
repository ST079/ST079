// src/components/SitePointer.tsx
"use client";

import { Pointer } from "@/components/ui/pointer";
import siteConfig from "@/src/config/siteConfig";

export function SitePointer() {
  return (
    <Pointer
      className={siteConfig.pointerColor}
      style={{ zIndex: 9999 }}
    />
  );
}