import type { ComponentType, SVGProps } from "react";
import { Briefcase, FolderGit2, GraduationCap, Home, Layers, Mail, User } from "lucide-react";

import { GithubIcon, LinkedInIcon } from "@/components/icons/social-icons";
import profile from "@/config/profile";
import cardFront from "@/assets/lanyard/card-front.png";
import cardBack from "@/assets/lanyard/card-back.png";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

export interface NavSection {
  /** Must match the `id` of a <section> on the page. */
  id: string;
  label: string;
  icon: Icon;
}

export interface SocialLink {
  href: string;
  label: string;
  icon: Icon;
}

// Site-wide settings. Personal content (experience, projects, ...) lives in profile.ts.
export const siteConfig = {
  // <head> metadata
  title: `${profile.name} | ${profile.role}`,
  description: `${profile.name} is a junior backend engineer building APIs and production systems with C#/.NET, GraphQL, PostgreSQL, Kafka and Redis. Drive around his portfolio town or read the classic page.`,

  author: profile.name,

  navigation: {
    // In-page links shown in the classic view's dock, in page order.
    sections: [
      { id: "home", label: "Home", icon: Home },
      { id: "about", label: "About", icon: User },
      { id: "experience", label: "Experience", icon: Briefcase },
      { id: "projects", label: "Projects", icon: FolderGit2 },
      { id: "skills", label: "Skills", icon: Layers },
      { id: "education", label: "Education", icon: GraduationCap },
      { id: "contact", label: "Contact", icon: Mail },
    ] satisfies NavSection[],

    // External links, opened in a new tab.
    socials: [
      { href: profile.links.github, label: "GitHub", icon: GithubIcon },
      { href: profile.links.linkedin, label: "LinkedIn", icon: LinkedInIcon },
    ] satisfies SocialLink[],

    // Screen-reader heading for the social links group.
    socialsTitle: "Social Media Links",
  },

  // Full-screen intro shown before the site is revealed.
  intro: {
    durationMs: 3500,
    showText: false,
    text: "Loading portfolio...",
  },

  // Images composited onto the 3D badge.
  lanyard: {
    frontImage: cardFront.src,
    backImage: cardBack.src,
  },
};

export default siteConfig;
