"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { CarFront } from "lucide-react";

import { useMediaQuery } from "@/hooks/use-media-query";

export type ViewMode = "city" | "classic";

const ViewModeContext = createContext<{ mode: ViewMode; setMode: (mode: ViewMode) => void }>({
  mode: "city",
  setMode: () => {},
});

/** Which view is showing (the 3D town or the classic page), and a way to switch. */
export const useViewMode = () => useContext(ViewModeContext);

// three.js and the whole town load in their own client-only chunk, during the intro.
const City = dynamic(() => import("@/components/city/City"), {
  ssr: false,
  loading: () => <div className="fixed inset-0 z-[60] bg-[#e9eef3]" />,
});

/**
 * Shows the 3D town over the classic page. The classic page is always
 * rendered (and server-rendered), so its content stays readable by search
 * engines and is one click away. Visitors who prefer reduced motion start on
 * the classic page.
 */
export default function ViewModeShell({ children }: { children: ReactNode }) {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [choice, setChoice] = useState<ViewMode | null>(null);
  const mode: ViewMode = choice ?? (reducedMotion ? "classic" : "city");

  // The town covers the page, so stop the page underneath from scrolling.
  useEffect(() => {
    if (mode !== "city") return;
    const { style } = document.documentElement;
    const previous = style.overflow;
    style.overflow = "hidden";
    return () => {
      style.overflow = previous;
    };
  }, [mode]);

  return (
    <ViewModeContext.Provider value={{ mode, setMode: setChoice }}>
      {mode === "city" && <City onExit={() => setChoice("classic")} />}

      <div inert={mode === "city"} aria-hidden={mode === "city" || undefined}>
        {children}
      </div>

      {mode === "classic" && (
        <button
          type="button"
          onClick={() => setChoice("city")}
          className="fixed right-4 top-4 z-50 inline-flex items-center gap-2 rounded-full border bg-background/90 px-4 py-2 text-sm font-medium shadow-sm backdrop-blur transition-colors hover:bg-muted sm:right-6 sm:top-6"
        >
          <CarFront className="size-4" aria-hidden />
          Drive the town
        </button>
      )}
    </ViewModeContext.Provider>
  );
}
