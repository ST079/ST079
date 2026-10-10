// Everything about Sujan in one place. The city and the classic page both read
// from this file, so edit content here rather than inside components.

export interface Project {
  name: string;
  /** Short category line, e.g. "Backend · Microservices". */
  kind: string;
  /** Used by the project filters. */
  category: "Backend" | "Full-stack" | "Systems" | "Web";
  summary: string;
  highlights: string[];
  stack: string[];
  links: { label: string; href: string }[];
  /** Picks the card's icon (see ProjectsContent). */
  icon: "workflow" | "diff" | "cart" | "calculator" | "terminal" | "shirt";
  color: string;
}

export const profile = {
  name: "Sujan Tamang",
  handle: "ST079",
  role: "Junior Backend Engineer",
  company: "Veel",
  location: "Bhaktapur, Nepal",
  email: "suzanyba079@gmail.com",
  links: {
    github: "https://github.com/ST079",
    linkedin: "https://www.linkedin.com/in/sujantamang80",
    /** This site's source. Required by its AGPL-3.0 licence. */
    source: "https://github.com/ST079/ST079",
  },
  motto: "Always learning. Always building.",

  summary:
    "I build backend systems that power real-world products. I'm a Junior Backend Engineer at Veel, where I work on scalable backend services, APIs and production systems using C#/.NET, GraphQL, PostgreSQL, Kafka, Redis and Entity Framework Core.",

  // "What sets me apart"
  edge: "I don't just enjoy building software, I enjoy understanding how it works and explaining it clearly. Before moving into backend engineering I taught web development to 50+ students, which sharpened my communication, documentation and mentoring alongside the technical work.",

  facts: [
    { label: "Based in", value: "Bhaktapur, Nepal" },
    { label: "Currently", value: "Junior Backend Engineer @ Veel" },
    { label: "Core stack", value: "C#, .NET, GraphQL, PostgreSQL, Kafka" },
    { label: "Taught", value: "Web development to 50+ students" },
  ],

  whatIDo: [
    "Build and maintain production backend services",
    "Design APIs and business logic",
    "Work with relational databases and data access layers",
    "Implement event-driven systems and asynchronous workflows",
    "Apply clean architecture, DDD and dependency injection",
    "Debug, test, review and keep improving backend systems",
  ],

  experience: [
    {
      role: "Junior Backend Engineer",
      company: "Veel",
      period: "Aug 2026 – Present",
      location: "Kathmandu, Nepal",
      current: true,
      summary:
        "I build and maintain scalable backend services and APIs for production applications, working with cross-functional teams and following clean coding practices and modern software architecture.",
      highlights: [
        "Develop backend services with C# and .NET",
        "Design and maintain GraphQL APIs with Hot Chocolate",
        "Work with PostgreSQL and Entity Framework Core for data access",
        "Apply dependency injection, the repository pattern and domain-driven design",
        "Contribute to event-driven workflows with Kafka and tune performance with Redis",
        "Take part in code reviews, debugging and testing",
      ],
      stack: ["C#", ".NET", "Hot Chocolate", "PostgreSQL", "EF Core", "Kafka", "Redis"],
    },
    {
      role: "Backend Engineering Intern",
      company: "Veel",
      period: "May 2026 – Aug 2026",
      location: "Kathmandu, Nepal",
      current: false,
      summary: "My first professional backend role, building scalable systems as part of the platform team.",
      highlights: [
        "Developed and maintained GraphQL APIs with ASP.NET Core for core platform features",
        "Worked with SQL and NoSQL databases for data management and querying",
        "Collaborated on server-side logic, code reviews and architecture improvements",
      ],
      stack: ["ASP.NET Core", "GraphQL", "SQL", "NoSQL"],
    },
  ],

  previously: [
    { role: "Internship Trainee", org: "Nobel Learning PBC", period: "Apr – Jul 2025" },
    { role: "General Member", org: "Code for Change", period: "2024" },
    { role: "Computer Instructor", org: "PI Educational World", period: "" },
    { role: "Computer Instructor", org: "Himchuli Academy", period: "" },
  ],

  projects: [
    {
      name: "Microservices with Kafka",
      category: "Backend",
      kind: "Backend · Event-driven",
      summary:
        "Order and Product services that stay in sync through Kafka, orchestrated with .NET Aspire.",
      highlights: [
        "Transactional outbox: orders and their events are saved together, then a background service publishes them to Kafka",
        "Idempotent consumer: the Product service records processed events so a redelivered message is never applied twice",
        "Hexagonal layers with domain ports, application facades and infrastructure adapters",
      ],
      stack: [".NET 10", "Aspire", "Kafka", "PostgreSQL", "EF Core", "Hot Chocolate"],
      links: [{ label: "Code", href: "https://github.com/ST079/MicroserviceWithKafka" }],
      icon: "workflow",
      color: "#2a9d8f",
    },
    {
      name: "GraphQL Schema Change Intelligence",
      category: "Backend",
      kind: "Backend tooling · Proof of concept",
      summary:
        "A CLI that diffs two GraphQL schemas and tells web and mobile teams which of their queries a change will break.",
      highlights: [
        "Classifies added, removed, modified and deprecated types, fields, arguments and enum values as Info, Warning or Breaking",
        "Parses client operations (AST-based, including fragments) to find the affected Android and web queries",
        "Suggests possible migrations and writes Markdown and JSON reports, with an optional webhook",
      ],
      stack: ["C#", ".NET", "GraphQL"],
      links: [{ label: "Code", href: "https://github.com/ST079/graphql-schema-change-poc" }],
      icon: "diff",
      color: "#e07a5f",
    },
    {
      name: "Nexora",
      category: "Full-stack",
      kind: "Full-stack · E-commerce",
      summary:
        "A spec-first electronics storefront for the Kathmandu market, running on a REST API I built with Express and MongoDB.",
      highlights: [
        "Express 5 + MongoDB API for auth, products, orders and payments",
        "Khalti, Stripe and cash-on-delivery checkout with live order tracking",
        "Next.js 16 storefront with Redux Toolkit and an admin dashboard",
      ],
      stack: ["Express 5", "MongoDB", "Stripe", "Khalti", "Next.js 16", "Redux Toolkit"],
      links: [
        { label: "Live", href: "https://nexora-frontend-rho.vercel.app" },
        { label: "API code", href: "https://github.com/ST079/Nexora-express-Api" },
        { label: "Web code", href: "https://github.com/ST079/nexora-frontend" },
      ],
      icon: "cart",
      color: "#3d5a80",
    },
    {
      name: "Influencer Price Calculator",
      category: "Backend",
      kind: "Backend · GraphQL API",
      summary:
        "A pricing API that helps creators and brands agree on fair rates, using a hybrid CPM + engagement model.",
      highlights: [
        "Returns price ranges for each platform and content format",
        "Platform, niche, content, usage and reach multipliers stored in the database with EF Core",
        "Clean architecture: GraphQL adapter, validated use cases and an infrastructure layer",
      ],
      stack: ["C#", ".NET", "GraphQL", "EF Core"],
      links: [{ label: "Code", href: "https://github.com/ST079/Influencer_Price_Calculator" }],
      icon: "calculator",
      color: "#e9a23b",
    },
    {
      name: "Build Your Own Shell",
      category: "Systems",
      kind: "Systems · CodeCrafters challenge",
      summary: "A POSIX-style shell written from scratch in C#.",
      highlights: [
        "A REPL that parses commands and runs external programs",
        "Builtins such as cd, pwd and echo",
      ],
      stack: ["C#", ".NET"],
      links: [{ label: "Code", href: "https://github.com/ST079/Build-your-own-Shell" }],
      icon: "terminal",
      color: "#6d6875",
    },
    {
      name: "ThriftZaar Nepal",
      category: "Web",
      kind: "Web app · BCA project",
      summary: "A second-hand clothing marketplace, built for my BCA fourth-semester project.",
      highlights: ["Built with plain HTML, CSS, JavaScript and PHP"],
      stack: ["PHP", "JavaScript", "HTML", "CSS"],
      links: [
        { label: "Live", href: "http://thriftzaar-nepal.page.gd" },
        { label: "Code", href: "https://github.com/ST079/thriftzaar-nepal" },
      ],
      icon: "shirt",
      color: "#81b29a",
    },
  ] satisfies Project[] as Project[],

  // Smaller repos, listed under the project grid.
  moreProjects: [
    {
      name: "Food Recipe App",
      note: "MERN app with JWT auth",
      href: "https://food-recipe-app-bay.vercel.app",
    },
    {
      name: "CodeIT MERN Stack",
      note: "My MERN learning journey",
      href: "https://github.com/ST079/CodeIT---MERN-Stack",
    },
    {
      name: "Leetering DSA",
      note: "Data structures & algorithms in C#",
      href: "https://github.com/ST079/Leetering-DSA",
    },
  ],

  skills: [
    { group: "Backend", items: ["C#", ".NET", "GraphQL", "REST APIs", "Node.js", "Express.js"] },
    { group: "Data", items: ["PostgreSQL", "MongoDB", "Entity Framework Core", "Redis"] },
    { group: "Messaging", items: ["Kafka"] },
    { group: "Frontend", items: ["React", "JavaScript", "Next.js", "Tailwind CSS"] },
    { group: "Tools", items: ["Git", "GitHub", "Docker", "Postman"] },
    {
      group: "Practices",
      items: ["Clean Architecture", "Domain-Driven Design", "Dependency Injection", "Repository Pattern", "Event-driven systems"],
    },
  ],

  education: [
    { school: "Tribhuvan University", degree: "Bachelor in Computer Application (BCA)", period: "Jan 2023" },
    { school: "Khwopa Higher Secondary School", degree: "+2 (Higher Secondary)", period: "2020 – 2023" },
  ],

  certifications: [
    "GitHub Fundamentals",
    "Backend Engineering Internship",
    "GDS and Ticketing Course (Advanced)",
    "Responsive Web Design",
    "Nobel Internship",
  ],
};

export default profile;
