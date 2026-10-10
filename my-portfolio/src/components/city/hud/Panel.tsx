"use client";

import type { ComponentType } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, X } from "lucide-react";

import AboutContent from "@/components/content/AboutContent";
import ContactContent from "@/components/content/ContactContent";
import EducationContent from "@/components/content/EducationContent";
import ExperienceContent from "@/components/content/ExperienceContent";
import ProjectsContent from "@/components/content/ProjectsContent";
import SkillsContent from "@/components/content/SkillsContent";
import { useMediaQuery } from "@/hooks/use-media-query";
import { DESTINATION_ICONS } from "../icons";
import { destinationById, nextStop, TOUR, type Destination, type DestinationId } from "../layout";
import { cityStore, driveTo, useCity } from "../store";

const CONTENT: Record<DestinationId, ComponentType> = {
  about: AboutContent,
  experience: ExperienceContent,
  projects: ProjectsContent,
  skills: SkillsContent,
  education: EducationContent,
  contact: ContactContent,
};

const TITLES: Record<DestinationId, string> = {
  about: "Hi, I'm Sujan.",
  experience: "Where I've been building",
  projects: "Things I've built",
  skills: "Tools of the trade",
  education: "Learning, formally and otherwise",
  contact: "Let's build something reliable.",
};

function PanelCard({ d, offset }: { d: Destination; offset: { x?: number; y?: number } }) {
  const Icon = DESTINATION_ICONS[d.id];
  const Content = CONTENT[d.id];
  const next = nextStop(d.id);

  return (
    <motion.aside
      aria-label={d.section}
      initial={{ opacity: 0, ...offset }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, ...offset, transition: { duration: 0.18 } }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="pointer-events-auto absolute inset-x-2 bottom-[76px] flex max-h-[50vh] flex-col overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-black/5 sm:inset-x-auto sm:bottom-24 sm:right-5 sm:top-20 sm:max-h-none sm:w-[440px]"
    >
      <header className="flex items-center gap-3 border-b px-5 py-4">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-2xl text-white"
          style={{ background: d.color }}
        >
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">
            {d.section} · {d.place}
          </p>
          <h2 className="truncate text-lg font-semibold leading-tight">{TITLES[d.id]}</h2>
        </div>
        <button
          type="button"
          onClick={() => cityStore.set({ dismissed: d.id })}
          aria-label="Close (Esc)"
          className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">
        <Content />
      </div>

      <footer className="flex items-center justify-between gap-3 border-t px-5 py-3">
        <span className="text-xs text-muted-foreground">
          Stop {TOUR.indexOf(d.id) + 1} of {TOUR.length}
        </span>
        <button
          type="button"
          onClick={(e) => {
            driveTo(next.id);
            e.currentTarget.blur();
          }}
          className="group inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ background: next.color }}
        >
          Next: {next.section}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </button>
      </footer>
    </motion.aside>
  );
}

/**
 * The section card that opens while the car is parked at a destination:
 * a side panel on desktop, a bottom sheet on phones.
 */
export default function Panel() {
  const active = useCity((s) => s.active);
  const dismissed = useCity((s) => s.dismissed);
  const sheet = useMediaQuery("(max-width: 639px)");

  const open = active && active !== dismissed ? destinationById[active] : null;
  const closed = active && dismissed === active ? destinationById[active] : null;

  return (
    <>
      <AnimatePresence mode="wait">
        {open && <PanelCard key={open.id} d={open} offset={sheet ? { y: 40 } : { x: 40 }} />}
      </AnimatePresence>

      {closed && (
        <button
          type="button"
          onClick={() => cityStore.set({ dismissed: null })}
          className="pointer-events-auto absolute bottom-[76px] right-2 inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-medium shadow-md ring-1 ring-black/5 sm:bottom-24 sm:right-5"
        >
          <span className="size-2 rounded-full" style={{ background: closed.color }} />
          Open {closed.section}
          <kbd className="hidden rounded border px-1 font-sans text-[10px] text-muted-foreground sm:inline">E</kbd>
        </button>
      )}
    </>
  );
}
