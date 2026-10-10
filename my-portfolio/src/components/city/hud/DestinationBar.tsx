"use client";

import { DESTINATION_ICONS } from "../icons";
import { destinations } from "../layout";
import { driveTo, useCity } from "../store";

/** "Where to?": one button per destination; the car drives itself there. */
export default function DestinationBar() {
  const active = useCity((s) => s.active);
  const driving = useCity((s) => s.driving);

  return (
    <nav
      aria-label="Destinations"
      className="pointer-events-auto absolute inset-x-2 bottom-2 sm:inset-x-auto sm:bottom-5 sm:left-1/2 sm:w-max sm:max-w-[calc(100vw-2rem)] sm:-translate-x-1/2"
    >
      <div className="flex gap-1 overflow-x-auto rounded-2xl bg-white/90 p-1.5 shadow-lg ring-1 ring-black/5 backdrop-blur [scrollbar-width:none]">
        <span className="hidden shrink-0 items-center pl-3 pr-1 text-xs font-medium text-muted-foreground xl:flex">
          Where to?
        </span>
        {destinations.map((d, i) => {
          const Icon = DESTINATION_ICONS[d.id];
          const here = active === d.id;
          const heading = driving === d.id;
          return (
            <button
              key={d.id}
              type="button"
              onClick={(e) => {
                driveTo(d.id);
                e.currentTarget.blur(); // keep Space/Enter for driving, not this button
              }}
              aria-current={here ? "location" : undefined}
              className="flex shrink-0 items-center gap-2 rounded-xl px-2.5 py-1.5 text-sm transition-colors hover:bg-black/5 sm:px-3 sm:py-2"
              style={here ? { background: `${d.color}1f` } : undefined}
            >
              <span
                className={`flex size-7 items-center justify-center rounded-full text-white ${heading ? "animate-pulse" : ""}`}
                style={{ background: d.color }}
              >
                <Icon className="size-3.5" aria-hidden />
              </span>
              <span className="font-medium">{d.section}</span>
              <kbd className="hidden font-sans text-[10px] text-muted-foreground lg:inline">{i + 1}</kbd>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
