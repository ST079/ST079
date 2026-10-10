"use client";

import { useRef, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useSpring } from "motion/react";

/**
 * A line beside its children that fills in as you scroll through them,
 * like a progress bar for the experience timeline.
 */
export default function ScrollTimeline({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 55%"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.4 });

  return (
    <div ref={ref} className="relative pl-7 sm:pl-10">
      <div aria-hidden className="absolute bottom-3 left-2 top-3 w-px bg-border sm:left-3.5" />
      <motion.div
        aria-hidden
        className="absolute bottom-3 left-2 top-3 w-0.5 -translate-x-[0.5px] origin-top rounded-full bg-foreground sm:left-3.5"
        style={{ scaleY: reducedMotion ? scrollYProgress : smooth }}
      />
      {children}
    </div>
  );
}
