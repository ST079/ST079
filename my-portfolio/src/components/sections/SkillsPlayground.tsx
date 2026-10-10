"use client";

import { useState } from "react";
import { ArrowDown, Hand, RotateCcw } from "lucide-react";

import FallingText, { type FallingItem } from "@/components/ui/falling-text";
import profile from "@/config/profile";
import { SKILL_LOGOS } from "@/config/skill-logos";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

// The tools that have a logo, as tiles in their brand colours; the ones used
// every day at work are bigger. (Practices like Clean Architecture have no
// logo, so they're only in the list below the playground.)
const TOOLS = profile.skills.flatMap((g) => g.items).filter((s) => s in SKILL_LOGOS);
const CORE = ["C#", ".NET", "GraphQL", "PostgreSQL", "Kafka", "Redis"];

function LogoTile({ name }: { name: string }) {
  const { Icon, mark, bg, fg = "#ffffff" } = SKILL_LOGOS[name];
  const big = CORE.includes(name);
  return (
    <span
      className={cn(
        "grid place-items-center rounded-2xl shadow-md ring-1 ring-black/10",
        big ? "size-[72px] sm:size-20" : "size-14 sm:size-16",
      )}
      style={{ background: bg, color: fg }}
    >
      {mark ? (
        // Lettering logos (JS) sit in the bottom-right corner, as in the original.
        <span className={cn("self-end justify-self-end pb-1.5 pr-2 font-black leading-none", big ? "text-2xl" : "text-xl")}>
          {mark}
        </span>
      ) : (
        Icon && <Icon className={big ? "size-10 sm:size-11" : "size-8 sm:size-9"} aria-hidden />
      )}
    </span>
  );
}

const TILES: FallingItem[] = TOOLS.map((name) => ({ key: name, label: name, node: <LogoTile name={name} /> }));

/**
 * The tools as a physics toy: hover (or tap) the box and the logo tiles
 * tumble down; then grab and throw them around. "Stack them again" resets.
 * With reduced motion the tiles just sit still.
 */
export default function SkillsPlayground() {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const touch = useMediaQuery("(pointer: coarse)");
  const [round, setRound] = useState(0);
  const [dropped, setDropped] = useState(false);
  const [requested, setRequested] = useState(false);

  const reset = () => {
    setRound((r) => r + 1);
    setDropped(false);
    setRequested(false);
  };

  return (
    <div>
      <p className="sr-only">Tools: {TOOLS.join(", ")}.</p>

      <div
        aria-hidden
        className="relative h-[420px] overflow-hidden rounded-3xl border bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.07)_1px,transparent_0)] bg-[length:22px_22px] sm:h-[340px]"
      >
        {reducedMotion ? (
          <div className="flex h-full flex-wrap content-start items-center justify-center gap-3 overflow-y-auto p-8">
            {TOOLS.map((name) => (
              <span key={name} title={name}>
                <LogoTile name={name} />
              </span>
            ))}
          </div>
        ) : (
          <FallingText
            key={round}
            items={TILES}
            chamfer={16}
            restitution={0.45}
            trigger={touch ? "click" : "hover"}
            active={requested}
            gravity={0.56}
            mouseConstraintStiffness={0.9}
            wordSpacing="5px"
            className="px-4 pt-10 sm:px-10"
            onStart={() => setDropped(true)}
          />
        )}

        {!reducedMotion && (
          <span className="pointer-events-none absolute left-4 top-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Hand className="size-3.5" aria-hidden />
            {dropped
              ? touch
                ? "Tap “Stack them again” to replay"
                : "Grab a logo and throw it"
              : touch
                ? "Tap the box"
                : "Hover the box"}
          </span>
        )}
      </div>

      {!reducedMotion && (
        <div className="mt-3 flex justify-end">
          {dropped ? (
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-10 items-center gap-2 rounded-full border bg-background px-4 text-sm font-medium transition-colors duration-200 hover:bg-muted"
            >
              <RotateCcw className="size-4" aria-hidden />
              Stack them again
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setRequested(true)}
              className="inline-flex h-10 items-center gap-2 rounded-full border bg-background px-4 text-sm font-medium transition-colors duration-200 hover:bg-muted"
            >
              <ArrowDown className="size-4" aria-hidden />
              Drop the logos
            </button>
          )}
        </div>
      )}
    </div>
  );
}
