import ScrollRevealText from "@/components/ui/scroll-reveal-text";

// Built from the résumé summary, the "what sets me apart" note and the motto.
const STATEMENT =
  "I build backend systems that power real-world products. Clean architecture, reliable APIs and event-driven workflows, built by someone who wants to understand how things work well enough to explain them clearly. Always learning. Always building.";

/**
 * A dark band between About and Experience: a short statement whose words
 * light up as you scroll through it.
 */
export default function HowIWork() {
  return (
    <section aria-labelledby="how-i-work" className="bg-[#0b0b0c] px-6 py-28 text-white sm:py-36 lg:px-16">
      <div className="mx-auto max-w-5xl">
        <h2 id="how-i-work" className="mb-8 text-sm font-medium uppercase tracking-[0.2em] text-white/50">
          How I work
        </h2>
        <ScrollRevealText
          text={STATEMENT}
          highlight={["backend", "real-world", "reliable", "event-driven", "clearly.", "Always"]}
          className="text-[clamp(1.6rem,3.6vw,3rem)] font-semibold leading-[1.3] tracking-tight"
        />
      </div>
    </section>
  );
}
