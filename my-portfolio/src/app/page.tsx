import React from "react";
import { NavigationDock } from "../components/sections/NavigationDock";
import { Highlighter } from "@/components/ui/highlighter";

const page = () => {
  return (
    <>
      <NavigationDock />

      {/* Hero Section */}
      <section className="flex min-h-screen items-center justify-center px-6">
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
      </section>

      
      <section></section>
    </>
  );
};

export default page;

