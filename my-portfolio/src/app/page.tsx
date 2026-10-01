import React from "react";
import { NavigationDock } from "../components/sections/NavigationDock";
import { Highlighter } from "@/components/ui/highlighter";
import LogoLoop from "../ui/LogoLoop";
import LanyardClient from "../components/LanyardClient";

import {
  SiSharp,
  SiDotnet,
  SiPostgresql,
  SiDocker,
  SiRedis,
  SiTailwindcss,
  SiReact,
  SiMongodb,
  SiNodedotjs,
  SiExpress,
  SiNextdotjs,
} from "react-icons/si";

const techLogos = [
  {
    node: <SiSharp />,
    title: "C#",
    href: "https://learn.microsoft.com/en-us/dotnet/csharp/",
  },
  {
    node: <SiDotnet />,
    title: ".NET",
    href: "https://dotnet.microsoft.com/",
  },
  {
    node: <SiPostgresql />,
    title: "PostgreSQL",
    href: "https://www.postgresql.org/",
  },
  {
    node: <SiDocker />,
    title: "Docker",
    href: "https://www.docker.com/",
  },
  {
    node: <SiRedis />,
    title: "Redis",
    href: "https://redis.io/",
  },
  {
    node: <SiTailwindcss />,
    title: "Tailwind CSS",
    href: "https://tailwindcss.com/",
  },
  {
    node: <SiReact />,
    title: "React",
    href: "https://react.dev/",
  },
  {
    node: <SiMongodb />,
    title: "MongoDB",
    href: "https://www.mongodb.com/",
  },
  {
    node: <SiNodedotjs />,
    title: "Node.js",
    href: "https://nodejs.org/",
  },
  {
    node: <SiExpress />,
    title: "Express.js",
    href: "https://expressjs.com/",
  },
  {
    node: <SiNextdotjs />,
    title: "Next.js",
    href: "https://nextjs.org/",
  },
];

const page = () => {
  return (
    <>
      <NavigationDock />

      {/* Hero Section: text on the left, lanyard hanging from the top on the right */}
      <section className="relative flex min-h-screen flex-col overflow-x-clip lg:flex-row">
        {/* Left column */}
        <div className="flex min-w-0 flex-1 flex-col items-center justify-center px-6 py-16 lg:items-start lg:py-0 lg:pl-16 lg:pr-[420px]">
          <div className="max-w-3xl text-center lg:text-left">
            <p className="mb-4 text-sm text-muted-foreground">
              Hi, I&#39;m Sujan Tamang
            </p>

            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Junior{" "}
              <Highlighter action="underline" color="#FF9800">
                Backend Developer
              </Highlighter>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg lg:mx-0">
              I build{" "}
              <Highlighter action="highlight" color="#87CEFA">
                scalable backend systems
              </Highlighter>{" "}
              with C#, .NET, PostgreSQL, and modern cloud-native technologies.
            </p>

            <p className="mt-4 text-sm text-muted-foreground">
              C# · .NET · PostgreSQL · Docker · OpenTelemetry
            </p>
          </div>

          {/* Tech Stack: now spans the left column instead of the full screen */}
          <div className="mt-16 w-full">
            <h3 className="mb-4 text-center text-lg font-medium text-foreground lg:text-left">
              Tech Stack
            </h3>

            <LogoLoop className="w-full" logos={techLogos} />
          </div>
        </div>

        {/* Lanyard layer: exactly viewport-wide, so the card can swing anywhere on the
            screen. The rope anchor is shifted toward the right edge by the camera
            (see ViewShift in Lanyard.tsx), not by moving the canvas.
            pointer-events-none lets clicks reach the page; dragging is handled by the
            eventSource set in Lanyard.tsx. z-30 sits above content, below the dock. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 right-[-1000px] z-30 hidden h-screen lg:block">
          <LanyardClient />
        </div>
      </section>
    </>
  );
};

export default page;