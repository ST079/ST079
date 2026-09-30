import React from "react";
import { NavigationDock } from "../components/sections/NavigationDock";
import { Highlighter } from "@/components/ui/highlighter";
import LogoLoop from "../ui/LogoLoop";

import {
  SiSharp,
  SiDotnet,
  SiPostgresql,
  SiDocker,
  SiRedis,
} from "react-icons/si";

const techLogos = [
  {
    node: <SiSharp />,
    title: "C#",
    href: "https://learn.microsoft.com/en-us/dotnet/csharp/",
  },
  { node: <SiDotnet />, title: ".NET", href: "https://dotnet.microsoft.com/" },
  {
    node: <SiPostgresql />,
    title: "PostgreSQL",
    href: "https://www.postgresql.org/",
  },
  { node: <SiDocker />, title: "Docker", href: "https://www.docker.com/" },
  { node: <SiRedis />, title: "Redis", href: "https://redis.io/" },
];

const page = () => {
  return (
    <>
      <NavigationDock />

      {/* Hero Section */}
      <section className="flex min-h-screen flex-col items-center justify-center px-6">
        {/* Hero Content */}
        <div className="max-w-3xl text-center">
          <p className="mb-4 text-sm text-muted-foreground">
            Hi, I'm Sujan Tamang
          </p>

          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Junior{" "}
            <Highlighter action="underline" color="#FF9800">
              Backend Developer
            </Highlighter>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
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

        {/* Full Width Tech Stack */}
        <div className="mt-16 w-screen">
          <h3 className="mb-4 text-center text-lg font-medium text-foreground">
            Tech Stack
          </h3>

          <LogoLoop className="w-full" logos={techLogos} />
        </div>
      </section>
    </>
  );
};

export default page;
