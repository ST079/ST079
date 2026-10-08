"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

// Registering also protects ScrollTrigger from being tree-shaken in production builds.
gsap.registerPlugin(useGSAP, ScrollTrigger);

const SCROLL_TRIGGER_ID = "horizontal-scroll";

/**
 * Smoothly scrolls to the section with the given id. Inside the pinned
 * horizontal track a plain `#id` jump can't work (the panel is moved with a
 * transform, not by scrolling), so we scroll the window to the point where the
 * track has slid that panel into view.
 */
export function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;

  const trigger = ScrollTrigger.getById(SCROLL_TRIGGER_ID);
  const track = trigger?.trigger?.firstElementChild as HTMLElement | null;

  // The trigger only exists on lg+ screens (see matchMedia below).
  if (trigger && track?.contains(el)) {
    const panel = Array.from(track.children).find((child) =>
      child.contains(el),
    ) as HTMLElement;
    const offset = Math.min(
      panel.offsetLeft - track.offsetLeft,
      trigger.end - trigger.start,
    );
    window.scrollTo({ top: trigger.start + offset, behavior: "smooth" });
    return;
  }

  el.scrollIntoView({ behavior: "smooth" });
}

/**
 * Turns its children (full-screen panels) into a horizontal strip that moves
 * sideways while the user scrolls down. On screens below `lg` it does nothing and
 * the panels simply stack vertically.
 *
 * Panels should be `lg:w-screen lg:h-screen lg:shrink-0`.
 * Any element inside a panel with a `data-reveal` attribute fades/slides in when
 * it scrolls into view horizontally.
 */
export default function HorizontalScroll({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // matchMedia: the horizontal setup only exists on large screens, and GSAP
      // reverts it automatically when the query stops matching.
      const mm = gsap.matchMedia();

      mm.add("(min-width: 1024px)", () => {
        const track = trackRef.current!;

        // How far the track must travel: its full width minus one screen.
        const distance = () => track.scrollWidth - window.innerWidth;

        const scrollTween = gsap.to(track, {
          x: () => -distance(),
          ease: "none", // linear, so scroll distance maps 1:1 to sideways movement
          scrollTrigger: {
            id: SCROLL_TRIGGER_ID,
            trigger: containerRef.current,
            pin: true, // hold the container in place while the track slides inside it
            scrub: 1, // takes ~1s to catch up to the scrollbar, which smooths it
            start: "top top",
            end: () => `+=${distance()}`, // scroll this many px, then release the pin
            invalidateOnRefresh: true, // re-run the function values above on resize
            anticipatePin: 1,
          },
        });

        // Reveal elements as they enter the screen from the right. These triggers
        // watch the track's horizontal movement through `containerAnimation`.
        gsap.utils.toArray<HTMLElement>("[data-reveal]", track).forEach((el, i) => {
          gsap.from(el, {
            opacity: 0,
            y: 40,
            duration: 0.8,
            delay: i * 0.08,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              containerAnimation: scrollTween,
              start: "left 85%", // when the element's left edge is 85% across the screen
              toggleActions: "play none none reverse",
            },
          });
        });
      });
    },
    { scope: containerRef },
  );

  return (
    <div ref={containerRef} className="lg:h-screen lg:overflow-hidden">
      <div ref={trackRef} className="flex flex-col lg:h-full lg:w-max lg:flex-row">
        {children}
      </div>
    </div>
  );
}