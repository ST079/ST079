"use client";

import { useState } from "react";
import { ArrowDown, Hand, RotateCcw } from "lucide-react";

import FallingText from "@/components/ui/falling-text";
import profile from "@/config/profile";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

// Every skill as one "word": multi-word skills are glued with non-breaking
// spaces so they fall as a single chip.
const ALL_SKILLS = profile.skills.flatMap((g) => g.items);
const TEXT = ALL_SKILLS.map((s) => s.replaceAll(" ", " ")).join(" ");
const CORE = ["C#", ".NET", "GraphQL", "PostgreSQL", "Kafka", "Redis"];

const CHIP = "my-1 rounded-full border bg-background px-3 py-1 text-foreground shadow-sm";
const CORE_CHIP = "border-foreground bg-foreground font-medium text-background";

/**
 * Skills as a physics toy: hover (or tap) and the chips tumble down; then drag
 * and throw them around. "Stack them again" resets. With reduced motion the
 * chips just sit still.
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
      <p className="sr-only">Skills: {ALL_SKILLS.join(", ")}.</p>

      <div
        aria-hidden
        className="relative h-[420px] overflow-hidden rounded-3xl border bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.07)_1px,transparent_0)] bg-[length:22px_22px] sm:h-[340px]"
      >
        {reducedMotion ? (
          <div className="flex h-full flex-wrap content-start justify-center gap-2 overflow-y-auto p-8 text-base">
            {ALL_SKILLS.map((s) => (
              <span key={s} className={cn(CHIP, "my-0", CORE.includes(s) && CORE_CHIP)}>
                {s}
              </span>
            ))}
          </div>
        ) : (
          <FallingText
            key={round}
            text={TEXT}
            highlightWords={CORE}
            highlightClassName={CORE_CHIP}
            wordClassName={CHIP}
            trigger={touch ? "click" : "hover"}
            active={requested}
            gravity={0.56}
            mouseConstraintStiffness={0.9}
            fontSize="clamp(0.95rem, 1.5vw, 1.15rem)"
            wordSpacing="4px"
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
                : "Grab a skill and throw it"
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
              Drop the skills
            </button>
          )}
        </div>
      )}
    </div>
  );
}
