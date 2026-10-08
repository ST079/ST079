import Highlight from "@/components/Highlight";
import LanyardClient from "@/components/lanyard/LanyardClient";
import LogoLoop from "@/components/ui/logo-loop";
import siteConfig from "@/config/site";
import { techStack } from "@/config/tech-stack";

// Panel 1: intro text on the left, the 3D lanyard hanging from the top on the right.
export default function HeroSection() {
  return (
    <section
      id="home"
      className="relative flex min-h-screen flex-col overflow-x-clip lg:h-screen lg:w-screen lg:shrink-0 lg:flex-row"
    >
      <div className="flex min-w-0 flex-1 flex-col items-center justify-center px-6 py-16 lg:items-start lg:py-0 lg:pl-16 lg:pr-[420px]">
        <div className="max-w-3xl text-center lg:text-left">
          <p className="mb-4 text-sm text-muted-foreground">
            Hi, I&#39;m {siteConfig.author}
          </p>

          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Junior{" "}
            <Highlight action="underline" color="#FF9800">
              Backend Developer
            </Highlight>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg lg:mx-0">
            I build{" "}
            <Highlight action="highlight" color="#87CEFA">
              scalable backend systems
            </Highlight>{" "}
            with C#, .NET, PostgreSQL, and modern cloud-native technologies.
          </p>

          <p className="mt-4 text-sm text-muted-foreground">
            C# · .NET · PostgreSQL · Docker · OpenTelemetry
          </p>
        </div>

        <div className="mt-16 w-full">
          <h3 className="mb-4 text-center text-lg font-medium text-foreground lg:text-left">
            Tech Stack
          </h3>
          <LogoLoop className="w-full" logos={techStack} ariaLabel="Tech stack" />
        </div>
      </div>

      {/* Lanyard layer. It is wider than the screen on purpose: the canvas centres
          the badge, so extending it 1000px to the right pushes the badge right.
          pointer-events-none lets clicks reach the page; dragging still works
          because the canvas listens on document.body (see Lanyard.tsx). */}
      <div className="pointer-events-none absolute top-0 left-0 right-[-1000px] z-30 hidden h-screen lg:block">
        <LanyardClient />
      </div>
    </section>
  );
}
