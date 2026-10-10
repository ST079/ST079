import {
  ArrowUpRight,
  Calculator,
  GitCompareArrows,
  Shirt,
  ShoppingCart,
  SquareTerminal,
  Workflow,
} from "lucide-react";

import profile, { type Project } from "@/config/profile";
import { Eyebrow, Tag } from "./shared";

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
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border bg-card transition-shadow hover:shadow-md">
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
  return (
    <div className="@container space-y-8">
      <div className="grid gap-4 @2xl:grid-cols-2 @5xl:grid-cols-3">
        {profile.projects.map((project) => (
          <ProjectCard key={project.name} project={project} />
        ))}
      </div>

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
