"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

/**
 * A paragraph whose words light up one by one as it scrolls through the
 * viewport (scrubbed, so scrolling back dims them again). Words that start
 * with one of `highlight` light up in `accent` instead of `lit`.
 *
 * Pass plain text: SplitText rewrites the paragraph's DOM, and puts it back on
 * unmount. With reduced motion every word is simply lit.
 */
export default function ScrollRevealText({
  text,
  highlight = [],
  dim = "rgba(255, 255, 255, 0.15)",
  lit = "#ffffff",
  accent = "#ff9800",
  className,
}: {
  text: string;
  highlight?: string[];
  dim?: string;
  lit?: string;
  accent?: string;
  className?: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      // aria "auto": screen readers get the sentence, not a list of words.
      const split = SplitText.create(el, { type: "words", aria: "auto" });
      const colour = (word: Element) =>
        highlight.some((h) => word.textContent?.trim().startsWith(h)) ? accent : lit;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          split.words,
          { color: dim },
          {
            color: (_i: number, word: Element) => colour(word),
            ease: "none",
            stagger: 0.1,
            scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: true },
          },
        );
      });
      mm.add("(prefers-reduced-motion: reduce)", () => {
        split.words.forEach((word) => gsap.set(word, { color: colour(word) }));
      });

      return () => {
        mm.revert();
        split.revert();
      };
    },
    { scope: ref, dependencies: [text] },
  );

  return (
    <p ref={ref} className={cn(className)} style={{ color: dim }}>
      {text}
    </p>
  );
}
