import type { ReactNode } from "react";

import Reveal from "@/components/Reveal";
import Perch from "@/components/sidekick/Perch";

/** Layout for the vertical sections after the horizontal hero/about panels. */
export default function Section({
  id,
  eyebrow,
  title,
  intro,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="mx-auto w-full max-w-6xl scroll-mt-8 px-6 py-20 sm:py-24 lg:px-16">
      <Reveal>
        <p className="mb-3 text-sm text-muted-foreground">{eyebrow}</p>
        <Perch section={id}>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
        </Perch>
        {intro && <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">{intro}</p>}
      </Reveal>
      <Reveal delay={0.08} className="mt-10">
        {children}
      </Reveal>
    </section>
  );
}
