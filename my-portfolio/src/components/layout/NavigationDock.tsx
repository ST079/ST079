"use client";

import { Dock, DockIcon } from "@/components/ui/dock";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { scrollToSection } from "@/lib/scroll-to-section";
import siteConfig from "@/config/site";
import { useActiveSection } from "@/hooks/use-active-section";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

const { sections, socials, socialsTitle } = siteConfig.navigation;
const sectionIds = sections.map((s) => s.id);

/**
 * Floating macOS-style dock: in-page links on the left, socials on the right.
 * On phones it shrinks and drops the socials (they're in the Contact section).
 */
export default function NavigationDock() {
  const active = useActiveSection(sectionIds);
  const compact = useMediaQuery("(max-width: 520px)");

  return (
    // The wrapper spans the screen, so let clicks pass through it.
    <nav className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center">
      <TooltipProvider delay={100}>
        <Dock
          className="pointer-events-auto mt-0"
          iconSize={compact ? 36 : 40}
          iconMagnification={compact ? 36 : 60}
          iconDistance={120}
        >
          {sections.map(({ id, label, icon: Icon }) => (
            <DockIcon key={id}>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <a
                      href={`#${id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        scrollToSection(id);
                      }}
                      aria-label={label}
                      aria-current={active === id ? "page" : undefined}
                      className={cn(
                        "relative flex size-full items-center justify-center rounded-full transition-colors",
                        active === id
                          ? "text-foreground"
                          : "text-muted-foreground hover:text-foreground",
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
          {!compact && <div className="h-full w-px bg-border" aria-hidden />}

          <div className={cn("relative flex flex-row items-center gap-2", compact && "hidden")}>
            <h2 className="sr-only">{socialsTitle}</h2>
            {socials.map(({ href, label, icon: Icon }) => (
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
          </div>
        </Dock>
      </TooltipProvider>
    </nav>
  );
}
