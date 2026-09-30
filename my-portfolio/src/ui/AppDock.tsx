"use client";

import Link from "next/link";
import { Home, Search, Settings } from "lucide-react";
import { Dock, DockIcon } from "@/components/ui/dock";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const items = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/search", label: "Search", Icon: Search },
  { href: "/settings", label: "Settings", Icon: Settings },
];

export function AppDock() {
  return (
    <div className="fixed inset-x-0 bottom-4 flex justify-center">
      <TooltipProvider>
        <Dock iconSize={40} iconMagnification={64} iconDistance={140}>
          {items.map(({ href, label, Icon }) => (
            <DockIcon key={href}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={href}
                    aria-label={label}
                    className="flex size-full items-center justify-center"
                  >
                    <Icon className="size-5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent>{label}</TooltipContent>
              </Tooltip>
            </DockIcon>
          ))}
        </Dock>
      </TooltipProvider>
    </div>
  );
}
