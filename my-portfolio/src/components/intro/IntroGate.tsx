"use client";

import { createContext, useContext, useEffect, useState } from "react";
import IntroLoader from "./IntroLoader";

const IntroContext = createContext(false);

/** True once the intro overlay has fully left the screen. */
export const useIntroDone = () => useContext(IntroContext);

/**
 * Shows the intro overlay on top of the page. The page itself renders (and is
 * server-rendered) underneath, so heavy client code like the 3D lanyard loads
 * while the intro plays instead of after it.
 */
export default function IntroGate({ children }: { children: React.ReactNode }) {
  const [introDone, setIntroDone] = useState(false);

  // Keep the page from scrolling behind the overlay.
  useEffect(() => {
    if (introDone) return;
    const { style } = document.documentElement;
    const previous = style.overflow;
    style.overflow = "hidden";
    return () => {
      style.overflow = previous;
    };
  }, [introDone]);

  return (
    <IntroContext.Provider value={introDone}>
      {!introDone && <IntroLoader onComplete={() => setIntroDone(true)} />}
      {children}
    </IntroContext.Provider>
  );
}
