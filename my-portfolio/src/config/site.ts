import type { ComponentType, SVGProps } from "react";
import { Home, User } from "lucide-react";

import { GithubIcon, LinkedInIcon } from "@/components/icons/social-icons";
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

// Site-wide configuration. Edit content here rather than in the components.
export const siteConfig = {
  // <head> metadata
  title: "Sujan Tamang | Software Developer",
  description: "ST079 Portfolio",

  author: "Sujan Tamang",

  navigation: {
    // In-page links shown in the dock, in page order.
    sections: [
      { id: "home", label: "Home", icon: Home },
      { id: "about", label: "About", icon: User },
    ] satisfies NavSection[],

    // External links, opened in a new tab.
    socials: [
      { href: "https://github.com/ST079", label: "GitHub", icon: GithubIcon },
      {
        href: "https://linkedin.com/in/sujantamang80",
        label: "LinkedIn",
        icon: LinkedInIcon,
      },
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
