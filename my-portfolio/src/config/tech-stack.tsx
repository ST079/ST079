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

import type { LogoItem } from "@/components/ui/logo-loop";

// Logos shown in the scrolling "Tech Stack" strip on the hero.
export const techStack: LogoItem[] = [
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
  {
    node: <SiTailwindcss />,
    title: "Tailwind CSS",
    href: "https://tailwindcss.com/",
  },
  { node: <SiReact />, title: "React", href: "https://react.dev/" },
  { node: <SiMongodb />, title: "MongoDB", href: "https://www.mongodb.com/" },
  { node: <SiNodedotjs />, title: "Node.js", href: "https://nodejs.org/" },
  { node: <SiExpress />, title: "Express.js", href: "https://expressjs.com/" },
  { node: <SiNextdotjs />, title: "Next.js", href: "https://nextjs.org/" },
];
