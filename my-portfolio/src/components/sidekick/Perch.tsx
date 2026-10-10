import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** CSS selector for the spot where Momo sits on a section's heading. */
export const perchSelector = (section: string) => `[data-momo-perch="${section}"]`;
/** CSS selector for every heading spot on the page. */
export const ALL_PERCHES = "[data-momo-perch]";
/** Which section a heading spot belongs to. */
export const perchSection = (el: Element) => el.getAttribute("data-momo-perch") ?? "";

/**
 * Wraps a section heading and marks where Momo, the sidekick, sits while that
 * section is on screen: on top of the heading's right end. The wrapper hugs the
 * heading's text, and the anchor is a Momo-sized box over its top-right corner,
 * sunk a little so Momo sits on the letters. Its size matches Momo's (56px on
 * phones, 72px from `sm`), which lets the sidekick tell how much of the spot is
 * on screen. Momo is a sibling of the heading, so it never becomes part of the
 * heading's name for screen readers.
 */
export default function Perch({
  section,
  className,
  children,
}: {
  section: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("relative w-fit", className)}>
      {children}
      <span
        data-momo-perch={section}
        className="absolute right-0 bottom-full size-14 translate-y-[24%] sm:size-[72px]"
      />
    </div>
  );
}
