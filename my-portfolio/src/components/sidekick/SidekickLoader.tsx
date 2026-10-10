"use client";

import dynamic from "next/dynamic";

import { useViewMode } from "@/components/layout/ViewModeShell";

// Momo is decorative and browser-only (the avatar renderer reads window), so it
// loads on the client, and only in the classic view.
const Sidekick = dynamic(() => import("./Sidekick"), { ssr: false });

export default function SidekickLoader() {
  const { mode } = useViewMode();
  return mode === "classic" ? <Sidekick /> : null;
}
