import AboutContent from "@/components/content/AboutContent";
import Reveal from "@/components/Reveal";
import Perch from "@/components/sidekick/Perch";

// About, right after the hero. Its heading is larger than the other sections',
// so it lays itself out instead of using <Section>.
export default function AboutSection() {
  return (
    <section id="about" className="mx-auto w-full max-w-6xl scroll-mt-8 px-6 py-20 sm:py-24 lg:px-16">
      <Reveal>
        <p className="mb-3 text-sm text-muted-foreground">About me</p>
        <Perch section="about">
          <h2 className="mb-8 text-4xl font-bold tracking-tight sm:text-5xl">
            I build the systems behind the interface.
          </h2>
        </Perch>
      </Reveal>
      <Reveal delay={0.08}>
        <AboutContent />
      </Reveal>
    </section>
  );
}
