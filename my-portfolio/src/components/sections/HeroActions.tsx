"use client";

import { ArrowDown, CarFront } from "lucide-react";

import { scrollToSection } from "@/lib/scroll-to-section";
import { useViewMode } from "@/components/layout/ViewModeShell";

/** The hero's call-to-action buttons. */
export default function HeroActions() {
  const { setMode } = useViewMode();

  return (
    <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
      <button
        type="button"
        onClick={() => scrollToSection("projects")}
        className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-85"
      >
        See my projects
        <ArrowDown className="size-4" aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => setMode("city")}
        className="inline-flex items-center gap-2 rounded-full border bg-background px-5 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
      >
        <CarFront className="size-4" aria-hidden />
        Drive through Bhaktapur
      </button>
    </div>
  );
}
