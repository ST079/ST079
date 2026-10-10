import type { ComponentType } from "react";
import { Braces, Database } from "lucide-react";
import {
  SiApachekafka,
  SiDocker,
  SiDotnet,
  SiExpress,
  SiGit,
  SiGithub,
  SiGraphql,
  SiMongodb,
  SiNextdotjs,
  SiNodedotjs,
  SiPostgresql,
  SiPostman,
  SiReact,
  SiRedis,
  SiTailwindcss,
} from "react-icons/si";
import { TbBrandCSharp } from "react-icons/tb";

export interface SkillLogo {
  /** The logo, drawn in `fg` on a tile of the brand colour. */
  Icon?: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  /** Brand colour, used for the tile. */
  bg: string;
  /** Logo colour on the tile (default white). */
  fg?: string;
  /** Logos that are lettering, drawn as text instead of an icon. */
  mark?: string;
}

/**
 * Logos and brand colours for the skills playground, keyed by the skill names
 * in profile.ts. Skills without an entry (the practices, like Clean
 * Architecture) have no logo and stay in the list below the playground.
 * REST and Entity Framework Core have no brand mark, so they get plain icons.
 */
export const SKILL_LOGOS: Record<string, SkillLogo> = {
  // Simple Icons dropped C#, so its mark comes from Tabler.
  "C#": { Icon: TbBrandCSharp, bg: "#68217A" },
  ".NET": { Icon: SiDotnet, bg: "#512BD4" },
  GraphQL: { Icon: SiGraphql, bg: "#E10098" },
  "REST APIs": { Icon: Braces, bg: "#334155" },
  "Node.js": { Icon: SiNodedotjs, bg: "#5FA04E" },
  "Express.js": { Icon: SiExpress, bg: "#1f1f1f" },
  PostgreSQL: { Icon: SiPostgresql, bg: "#4169E1" },
  MongoDB: { Icon: SiMongodb, bg: "#47A248" },
  "Entity Framework Core": { Icon: Database, bg: "#7B42BC" },
  Redis: { Icon: SiRedis, bg: "#FF4438" },
  Kafka: { Icon: SiApachekafka, bg: "#231F20" },
  React: { Icon: SiReact, bg: "#20232A", fg: "#61DAFB" },
  // The JS logo is black lettering on yellow, so it's drawn as lettering.
  JavaScript: { mark: "JS", bg: "#F7DF1E", fg: "#1f1f1f" },
  "Next.js": { Icon: SiNextdotjs, bg: "#000000" },
  "Tailwind CSS": { Icon: SiTailwindcss, bg: "#06B6D4" },
  Git: { Icon: SiGit, bg: "#F05032" },
  GitHub: { Icon: SiGithub, bg: "#181717" },
  Docker: { Icon: SiDocker, bg: "#2496ED" },
  Postman: { Icon: SiPostman, bg: "#FF6C37" },
};
