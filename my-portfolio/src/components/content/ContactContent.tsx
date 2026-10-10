"use client";

import { useState } from "react";
import { Check, Copy, Mail } from "lucide-react";

import { GithubIcon, LinkedInIcon } from "@/components/icons/social-icons";
import profile from "@/config/profile";

export default function ContactContent() {
  const [copied, setCopied] = useState(false);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard access can be blocked; the mailto link still works.
    }
  };

  const secondary =
    "inline-flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted";

  return (
    <div className="@container">
      <p className="max-w-xl text-base leading-relaxed text-muted-foreground @2xl:text-lg">
        Hiring, collaborating, or just want to talk backend? My inbox is open.
      </p>

      <div className="mt-6 flex flex-wrap gap-2.5">
        <a
          href={`mailto:${profile.email}`}
          className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-85"
        >
          <Mail className="size-4" aria-hidden />
          Email me
        </a>
        <a href={profile.links.linkedin} target="_blank" rel="noopener noreferrer" className={secondary}>
          <LinkedInIcon className="size-4" />
          LinkedIn
        </a>
        <a href={profile.links.github} target="_blank" rel="noopener noreferrer" className={secondary}>
          <GithubIcon className="size-4" />
          GitHub
        </a>
      </div>

      <button
        type="button"
        onClick={copyEmail}
        className="mt-4 inline-flex items-center gap-2 rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
        {copied ? "Copied!" : profile.email}
      </button>

      <p className="mt-8 text-sm font-medium">{profile.motto}</p>

      {/* The AGPL-3.0 licence asks that visitors can get this site's source. */}
      <p className="mt-6 text-xs text-muted-foreground">
        This site is open source under the AGPL-3.0.{" "}
        <a
          href={profile.links.source}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-foreground underline underline-offset-4 hover:no-underline"
        >
          View the source code
        </a>
      </p>
    </div>
  );
}
