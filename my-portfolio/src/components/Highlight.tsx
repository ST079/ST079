"use client";

import type { ComponentProps } from "react";

import { Highlighter } from "@/components/ui/highlighter";
import { useIntroDone } from "@/components/intro/IntroGate";

/**
 * `Highlighter` that waits for the intro overlay to leave, so the hand-drawn
 * annotation animates where the visitor can actually see it.
 */
export default function Highlight({
  children,
  ...props
}: ComponentProps<typeof Highlighter>) {
  const introDone = useIntroDone();

  if (!introDone) {
    return <span className="relative inline-block">{children}</span>;
  }

  return <Highlighter {...props}>{children}</Highlighter>;
}
