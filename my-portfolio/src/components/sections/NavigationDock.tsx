"use client"

import * as React from "react"
import { FolderGit2, Home, Mail, User } from "lucide-react"

import { Dock, DockIcon } from "@/components/ui/dock"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

/* ------------------------------------------------------------------ */
/* 1. Config: edit this, not the JSX                                    */
/* ------------------------------------------------------------------ */

// In-page links. `id` must match the id of a <section> on your page.
const sections = [
  { id: "home", label: "Home", Icon: Home },
  { id: "projects", label: "Projects", Icon: FolderGit2 },
  { id: "about", label: "About", Icon: User },
  { id: "contact", label: "Contact", Icon: Mail },
]

// External links open in a new tab.
const externalLinks = [
  {
    href: "https://github.com/ST079",
    label: "GitHub",
    Icon: GithubIcon,
  },
]

/* ------------------------------------------------------------------ */
/* 2. Track which section is on screen                                  */
/* ------------------------------------------------------------------ */

function useActiveSection(ids: string[]) {
  const [active, setActive] = React.useState(ids[0])

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the visible section closest to the top of the viewport.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      // Only the middle band of the viewport counts as "in view".
      { rootMargin: "-40% 0px -55% 0px" }
    )

    ids.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [ids])

  return active
}

/* ------------------------------------------------------------------ */
/* 3. The dock                                                         */
/* ------------------------------------------------------------------ */

export function NavigationDock() {
  const ids = React.useMemo(() => sections.map((s) => s.id), [])
  const active = useActiveSection(ids)

  return (
    // The wrapper spans the screen, so let clicks pass through it.
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center">
      <TooltipProvider delay={100}>
        <Dock
          className="pointer-events-auto mt-0"
          iconSize={40}
          iconMagnification={60}
          iconDistance={120}
        >
          {sections.map(({ id, label, Icon }) => (
            <DockIcon key={id}>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <a
                      href={`#${id}`}
                      aria-label={label}
                      aria-current={active === id ? "page" : undefined}
                      className={cn(
                        "relative flex size-full items-center justify-center rounded-full transition-colors",
                        active === id
                          ? "text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    />
                  }
                >
                  <Icon className="size-5" />
                  {active === id && (
                    <span className="absolute -bottom-1.5 size-1 rounded-full bg-foreground" />
                  )}
                </TooltipTrigger>
                <TooltipContent side="top">{label}</TooltipContent>
              </Tooltip>
            </DockIcon>
          ))}

          {/* Separator: Dock only injects mouseX into DockIcon children, so this is safe. */}
          <div className="h-full w-px bg-border" aria-hidden />

          {externalLinks.map(({ href, label, Icon }) => (
            <DockIcon key={href}>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="flex size-full items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
                    />
                  }
                >
                  <Icon className="size-5" />
                </TooltipTrigger>
                <TooltipContent side="top">{label}</TooltipContent>
              </Tooltip>
            </DockIcon>
          ))}
        </Dock>
      </TooltipProvider>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Inline brand icon (avoids depending on lucide's brand icons)         */
/* ------------------------------------------------------------------ */

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  )
}