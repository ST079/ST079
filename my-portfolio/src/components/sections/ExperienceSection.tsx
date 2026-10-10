"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

import { EarlierRoles, RoleCard } from "@/components/content/ExperienceContent";
import Reveal from "@/components/Reveal";
import Perch from "@/components/sidekick/Perch";
import profile from "@/config/profile";
import { pinId } from "@/lib/scroll-to-section";
import { cn } from "@/lib/utils";

// Registering also protects ScrollTrigger from being tree-shaken in production builds.
gsap.registerPlugin(useGSAP, ScrollTrigger);

/** Pin the section and slide the cards only where there's room for it and the
 *  visitor hasn't asked for less motion. Everywhere else the cards sit in a
 *  row you can swipe or scroll sideways. */
const PIN_QUERY = "(min-width: 1024px) and (min-height: 700px) and (prefers-reduced-motion: no-preference)";

const item = "@container relative w-[min(85vw,600px)] shrink-0 snap-start";
const dot = "absolute -top-6 left-5 size-3 rounded-full border-2 bg-background";

/**
 * "Where I've been building": the roles as cards in a sideways row along a
 * timeline. On large screens the section pins while you scroll down and the
 * row slides past; the timeline fills as it goes.
 */
export default function ExperienceSection() {
  const section = useRef<HTMLElement>(null);
  const rail = useRef<HTMLDivElement>(null); // the strip the cards sit in
  const track = useRef<HTMLDivElement>(null); // the row itself, plus the timeline
  const fill = useRef<HTMLSpanElement>(null); // the filled part of the timeline

  const paint = (progress: number) => {
    if (fill.current) fill.current.style.transform = `scaleX(${progress})`;
  };

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(PIN_QUERY, () => {
        const el = section.current!;
        const row = track.current!;
        const strip = rail.current!;
        // Switch the layout over first (full-screen, no sideways scrollbar),
        // so the measurements below are taken from it.
        el.dataset.pinned = "";
        const distance = () => Math.max(0, row.scrollWidth - strip.clientWidth);
        let travel = 0; // the last measured distance, refreshed with the tween

        gsap.to(row, {
          x: () => -(travel = distance()),
          ease: "none", // linear, so scroll distance maps 1:1 to sideways movement
          // Fill the timeline from where the row actually is. (GSAP runs this
          // once while still creating the tween, so it can't ask the tween.)
          onUpdate: () => paint(travel ? -Number(gsap.getProperty(row, "x")) / travel : 0),
          scrollTrigger: {
            id: pinId("experience"),
            trigger: el,
            pin: true, // hold the section in place while the row slides
            scrub: 1, // takes ~1s to catch up to the scrollbar, which smooths it
            start: "top top",
            end: () => `+=${distance()}`, // scroll this far, then release the pin
            invalidateOnRefresh: true, // re-run the functions above on resize
            anticipatePin: 1,
          },
        });

        return () => {
          delete el.dataset.pinned;
          paint(0);
        };
      });
    },
    { scope: section },
  );

  // As a swipeable row, the timeline follows the row's own scroll position.
  useEffect(() => {
    const strip = rail.current!;
    const onScroll = () => {
      const max = strip.scrollWidth - strip.clientWidth;
      paint(max > 0 ? strip.scrollLeft / max : 1);
    };
    if (section.current?.dataset.pinned === undefined) onScroll();
    strip.addEventListener("scroll", onScroll, { passive: true });
    return () => strip.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section
      ref={section}
      id="experience"
      className="group/xp relative scroll-mt-8 overflow-x-clip py-20 sm:py-24 data-[pinned]:flex data-[pinned]:h-screen data-[pinned]:flex-col data-[pinned]:justify-center data-[pinned]:pt-0 data-[pinned]:pb-16"
    >
      <div className="mx-auto w-full max-w-6xl px-6 lg:px-16">
        <Reveal>
          <p className="mb-3 text-sm text-muted-foreground">Experience</p>
          <Perch section="experience">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Where I&apos;ve been building</h2>
          </Perch>
        </Reveal>

        <Reveal delay={0.08} className="mt-10">
          <div
            ref={rail}
            tabIndex={0}
            role="region"
            aria-label="Roles, in a row that scrolls sideways"
            className="-mx-6 snap-x snap-mandatory scroll-px-6 overflow-x-auto overscroll-x-contain px-6 pb-4 outline-none focus-visible:ring-2 focus-visible:ring-ring lg:-mx-16 lg:scroll-px-16 lg:px-16 group-data-[pinned]/xp:mx-0 group-data-[pinned]/xp:snap-none group-data-[pinned]/xp:overflow-visible group-data-[pinned]/xp:px-0 group-data-[pinned]/xp:pb-0"
          >
            <div ref={track} className="relative w-max pt-6">
              {/* The timeline: a line through one dot per card, filling in as you go. */}
              <span aria-hidden className="absolute inset-x-0 top-[5.5px] h-px bg-border" />
              <span
                ref={fill}
                aria-hidden
                className="absolute inset-x-0 top-[5px] h-0.5 origin-left rounded-full bg-foreground"
                style={{ transform: "scaleX(0)" }}
              />

              <ol className="flex items-start gap-5">
                {profile.experience.map((job) => (
                  <li key={job.role} className={item}>
                    <span aria-hidden className={cn(dot, job.current ? "border-emerald-500" : "border-foreground/30")} />
                    <RoleCard job={job} />
                  </li>
                ))}
                <li className={item}>
                  <span aria-hidden className={cn(dot, "border-foreground/30")} />
                  <EarlierRoles />
                </li>
              </ol>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
