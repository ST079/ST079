"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowUpRight,
  Calculator,
  GitCompareArrows,
  Shirt,
  ShoppingCart,
  SquareTerminal,
  Workflow,
} from "lucide-react";

import TiltCard from "@/components/ui/tilt-card";
import profile, { type Project } from "@/config/profile";
import { cn } from "@/lib/utils";
import { Eyebrow, Tag } from "./shared";

const FILTERS = ["All", "Backend", "Full-stack", "Systems", "Web"] as const;
type Filter = (typeof FILTERS)[number];

const ICONS = {
  workflow: Workflow,
  diff: GitCompareArrows,
  cart: ShoppingCart,
  calculator: Calculator,
  terminal: SquareTerminal,
  shirt: Shirt,
} satisfies Record<Project["icon"], unknown>;

function ProjectCard({ project }: { project: Project }) {
  const Icon = ICONS[project.icon];
  const { color } = project;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border bg-card transition-shadow duration-200 hover:shadow-lg">
      {/* Abstract header: no screenshots, just the project's colour and icon */}
      <div
        className="relative h-24 overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${color}2e, ${color}0f)` }}
      >
        <span
          className="absolute -right-6 -top-10 size-32 rounded-full"
          style={{ background: `${color}22` }}
          aria-hidden
        />
        <span
          className="absolute right-16 top-10 size-14 rotate-12 rounded-2xl"
          style={{ background: `${color}1a` }}
          aria-hidden
        />
        <span
          className="absolute bottom-4 left-5 flex size-11 items-center justify-center rounded-xl bg-white shadow-sm"
          style={{ color }}
        >
          <Icon className="size-5" aria-hidden />
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-[11px] font-medium uppercase tracking-wide" style={{ color }}>
          {project.kind}
        </p>
        <h3 className="mt-1 text-base font-semibold">{project.name}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{project.summary}</p>

        <ul className="mt-3 space-y-1.5 text-sm">
          {project.highlights.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="mt-2 size-1 shrink-0 rounded-full bg-foreground/40" aria-hidden />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {project.stack.map((tech) => (
            <Tag key={tech}>{tech}</Tag>
          ))}
        </div>

        <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-5">
          {project.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-medium underline-offset-4 hover:underline"
            >
              {link.label}
              <ArrowUpRight className="size-3.5" aria-hidden />
            </a>
          ))}
        </div>
      </div>
    </article>
  );
}

export default function ProjectsContent() {
  const [filter, setFilter] = useState<Filter>("All");
  const shown = profile.projects.filter((p) => filter === "All" || p.category === filter);
  const count = (f: Filter) => (f === "All" ? profile.projects.length : profile.projects.filter((p) => p.category === f).length);

  return (
    <div className="@container space-y-6">
      <div role="group" aria-label="Filter projects" className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
            className={cn(
              "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors duration-200 pointer-coarse:h-11",
              filter === f ? "border-foreground bg-foreground text-background" : "bg-background hover:bg-muted",
            )}
          >
            {f}
            <span className={cn("text-xs tabular-nums", filter === f ? "text-background/70" : "text-muted-foreground")}>
              {count(f)}
            </span>
          </button>
        ))}
      </div>

      <motion.div layout className="grid gap-4 @2xl:grid-cols-2 @5xl:grid-cols-3">
        <AnimatePresence mode="popLayout" initial={false}>
          {shown.map((project) => (
            <motion.div
              key={project.name}
              layout
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <TiltCard className="rounded-2xl" glow={`${project.color}24`}>
                <ProjectCard project={project} />
              </TiltCard>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      <div>
        <Eyebrow>More on GitHub</Eyebrow>
        <ul className="mt-3 grid gap-2 @xl:grid-cols-2 @4xl:grid-cols-4">
          {profile.moreProjects.map((item) => (
            <li key={item.name}>
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 transition-colors hover:bg-muted"
              >
                <span>
                  <span className="block text-sm font-medium">{item.name}</span>
                  <span className="block text-xs text-muted-foreground">{item.note}</span>
                </span>
                <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              </a>
            </li>
          ))}
          <li>
            <a
              href={profile.links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-full items-center justify-between gap-3 rounded-xl border border-dashed px-4 py-3 text-sm font-medium transition-colors hover:bg-muted"
            >
              All repositories
              <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
