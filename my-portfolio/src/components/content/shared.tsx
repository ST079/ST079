import type { ReactNode } from "react";

// Small building blocks shared by the section contents. Every content block is
// used in two places (a wide classic section and a ~400px city panel), so the
// layouts respond to their container (@container / @md: ...) not the screen.

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border bg-background px-2.5 py-0.5 text-xs text-foreground/80">
      {children}
    </span>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
      {children}
    </h3>
  );
}
