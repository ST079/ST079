import AboutContent from "@/components/content/AboutContent";

// Panel 2 of the horizontal scroller. Elements with `data-reveal` animate in as
// the panel slides into view (see HorizontalScroll.tsx).
export default function AboutSection() {
  return (
    <section
      id="about"
      className="relative flex min-h-screen w-full items-center px-6 py-20 lg:h-screen lg:w-screen lg:shrink-0 lg:px-16 lg:py-0"
    >
      <div className="mx-auto w-full max-w-6xl">
        <p data-reveal className="mb-3 text-sm text-muted-foreground">
          About me
        </p>
        <h2 data-reveal className="mb-8 text-4xl font-bold tracking-tight sm:text-5xl">
          I build the systems behind the interface.
        </h2>
        <AboutContent />
      </div>
    </section>
  );
}
