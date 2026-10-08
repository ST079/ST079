const facts = [
  { label: "Based in", value: "Kathmandu, Nepal" },
  { label: "Focus", value: "Backend services and microservices" },
  { label: "Stack", value: "C#, .NET, GraphQL, PostgreSQL, Kafka, Redis, AWS" },
  { label: "Observability", value: "OpenTelemetry, Grafana" },
];

// Placeholder copy: edit the text freely. Every `data-reveal` element animates
// in as it scrolls into view (see HorizontalScroll.tsx).
export default function AboutSection() {
  return (
    <section
      id="about"
      className="relative flex min-h-screen w-full items-center px-6 py-20 lg:h-screen lg:w-screen lg:shrink-0 lg:px-16 lg:py-0"
    >
      <div className="mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
        {/* Text */}
        <div>
          <p data-reveal className="mb-4 text-sm text-muted-foreground">
            About me
          </p>

          <h2
            data-reveal
            className="text-4xl font-bold tracking-tight sm:text-5xl"
          >
            I build the systems behind the interface.
          </h2>

          <p
            data-reveal
            className="mt-6 text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            I&#39;m a junior backend engineer working with C# and .NET on
            microservices: authentication, an API gateway, and GraphQL APIs
            backed by PostgreSQL.
          </p>

          <p
            data-reveal
            className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            I started in full-stack JavaScript with the MERN stack, then moved
            into .NET. I care about observability too: tracing and logging
            services so problems are easy to find. I&#39;ve also taught MERN
            stack development to students.
          </p>
        </div>

        {/* Facts */}
        <dl className="grid gap-4 sm:grid-cols-2">
          {facts.map(({ label, value }) => (
            <div
              key={label}
              data-reveal
              className="rounded-xl border bg-card/50 p-5 backdrop-blur"
            >
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                {label}
              </dt>
              <dd className="mt-2 font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
