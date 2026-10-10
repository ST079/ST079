"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { createAvatar, type AvatarController } from "@bible-strong/avatar-react";
import "@bible-strong/avatar-react/styles.css";

import siteConfig from "@/config/site";
import { useActiveSection } from "@/hooks/use-active-section";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import momo from "./momo.avatar.json";
import { ALL_PERCHES, perchSection, perchSelector } from "./Perch";

// Momo, a little dumpling who keeps visitors company on the classic page. It
// sits on the heading of the section being read and hops over to the next
// heading as the visitor scrolls. When that heading scrolls off the top, Momo
// waits at the side of the screen until a heading comes into view again. It
// comments on each section the first time it lands there, follows the mouse
// with its eyes, naps when nobody's around, and gives tips when clicked.
// Visitors can hide it for the rest of their visit.
// Rendered with @bible-strong/avatar-react (AGPL-3.0).

const Momo = createAvatar(momo);
type Reaction = "hello" | "excited" | "curious" | "shy" | "waking";
type Look = "look-left" | "look-right" | "look-up" | "look-down";

const SECTION_IDS = siteConfig.navigation.sections.map((s) => s.id);

const SECTION_LINES: Record<string, { text: string; reaction: Reaction }> = {
  home: { text: "Namaste! I'm Momo. Click me for tips.", reaction: "hello" },
  about: { text: "That's Sujan: backend engineer, former teacher.", reaction: "curious" },
  experience: { text: "Production APIs at Veel, in C# and .NET.", reaction: "curious" },
  projects: { text: "Try the filters, then hover a card.", reaction: "excited" },
  skills: { text: "Hover the box. Chaos, guaranteed.", reaction: "excited" },
  education: { text: "Still learning, every day.", reaction: "shy" },
  contact: { text: "Say hi! The inbox is open.", reaction: "excited" },
};

const TIPS = [
  "Psst… you can drive through Bhaktapur. Top right!",
  "Every project card links to its code.",
  "Hover the skills box, then throw the logos around.",
  "Leave me alone for a bit and I'll take a nap.",
  "In the 3D town, press 1–6 to jump between places.",
];

/** Momo's spot at the side of the screen, used while no heading is in view. */
const SIDE = "side";

const SLEEP_AFTER_MS = 25_000;
const LINE_MS = 5500;
/** Wait for the scroll to settle before hopping, so racing past several
 *  sections ends in one hop instead of a string of them. */
const HOP_DELAY_MS = 150;
/** The "Drive through Bhaktapur" button floats over the top of the page, so
 *  Momo and its bubbles stay below this line. */
const TOP_CLEARANCE = 72;
/** How much of a heading's spot must be on screen: to land there from the
 *  side, and to stay once landed. The gap stops Momo from bouncing back and
 *  forth while a heading sits right at the edge. */
const LAND_RATIO = 0.8;
const STAY_RATIO = 0.4;
/** Hiding Momo lasts for the rest of the visit (this browser tab). */
const HIDDEN_KEY = "st079-momo-hidden";

type Placement = "above" | "right" | "left";
type Bubble = { text: string; spot: string | null; placement: Placement };

/** Rough height of a bubble: about 7px per character at text-sm, wrapped at
 *  the bubble's width, plus padding. */
const bubbleHeight = (text: string) => Math.ceil((text.length * 7.2) / 190) * 19 + 18;

export default function Sidekick() {
  const [hidden, setHidden] = useState(() => {
    try {
      return sessionStorage.getItem(HIDDEN_KEY) === "1";
    } catch {
      return false; // storage can be blocked; Momo just shows up
    }
  });
  if (hidden) return null;

  const hide = () => {
    try {
      sessionStorage.setItem(HIDDEN_KEY, "1");
    } catch {
      // Without storage, Momo stays hidden until the page reloads.
    }
    setHidden(true);
  };
  return <Companion onHide={hide} />;
}

function Companion({ onHide }: { onHide: () => void }) {
  const avatar = useRef<AvatarController>(null);
  const button = useRef<HTMLButtonElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const small = useMediaQuery("(max-width: 639px)");
  // With reduced motion Momo holds still: no idle loop, no eye-following, no
  // hopping (it just appears in the next spot) and no reactions of its own.
  // Clicking and hovering still get a response.
  const calm = useReducedMotion() ?? false;

  // Momo renders once into this element. Moving to another spot re-parents
  // the element, so the avatar keeps its state instead of mounting again.
  const [host] = useState(() => {
    const el = document.createElement("div");
    el.className = "absolute right-0 bottom-0";
    return el;
  });
  // The spot at the side of the screen: fixed to the right edge, half tucked
  // out of view on smaller screens (sliding out on hover or focus), fully in
  // view in the wide margin of large screens.
  const [side] = useState(() => {
    const el = document.createElement("div");
    el.className =
      "fixed top-[58%] right-0 z-40 size-14 translate-x-7 transition-[translate] duration-300 ease-out sm:size-[72px] sm:translate-x-9 xl:-translate-x-6 max-xl:focus-within:-translate-x-3 max-xl:hover:-translate-x-3";
    return el;
  });

  const active = useActiveSection(SECTION_IDS);
  // Where Momo has landed: a section's heading, or the side.
  const [spot, setSpot] = useState<string | null>(null);
  const [hopping, setHopping] = useState(false);
  // What Momo is saying, and in which spot. Hopping away hides it.
  const [bubble, setBubble] = useState<Bubble | null>(null);

  const state = useRef({
    busy: false,
    asleep: false,
    hopping: false,
    spot: null as string | null,
    said: new Set<string>(), // sections whose line Momo has already said
    ratios: new Map<string, number>(), // how much of each heading's spot is on screen
    ready: false, // the first visibility report has come in
    moveTimer: 0,
    tip: 0,
    bubbleTimer: 0,
    look: null as Look | null,
    lookTimer: 0,
    flight: [] as Animation[],
  });

  const react = (reaction: Reaction) => {
    state.current.busy = true;
    avatar.current?.play(reaction);
  };

  /** Go back to the resting loop for the current spot: looking around on a
   *  heading, peeking at the page from the side. */
  const rest = () => {
    const s = state.current;
    if (s.busy || s.asleep || s.hopping) return;
    const atSide = s.spot === SIDE;
    if (calm) avatar.current?.setExpression(atSide ? "look-left" : "neutral");
    else avatar.current?.play(atSide ? "peek" : "idle");
  };

  /** Show a bubble in the given spot. On a heading it goes above Momo when
   *  there's room below the floating button; otherwise beside Momo, on the
   *  right if the screen has space there, else on the left. At the side of the
   *  screen it always goes left, towards the page. */
  const say = (text: string, where: string | null, ms: number | null = LINE_MS) => {
    const r = button.current?.getBoundingClientRect();
    const placement: Placement =
      where === SIDE
        ? "left"
        : !r || r.top - 14 - bubbleHeight(text) >= TOP_CLEARANCE
          ? "above"
          : window.innerWidth - r.right >= 250
            ? "right"
            : "left";
    setBubble({ text, spot: where, placement });
    window.clearTimeout(state.current.bubbleTimer);
    if (ms) state.current.bubbleTimer = window.setTimeout(() => setBubble(null), ms);
  };

  /** Hop to a spot: a section's heading, or the side of the screen. */
  const moveTo = useEffectEvent((target: string) => {
    const container = target === SIDE ? side : document.querySelector<HTMLElement>(perchSelector(target));
    if (!container || host.parentElement === container) return;
    const s = state.current;
    const first = !host.isConnected;
    const from = host.getBoundingClientRect(); // includes a hop still in progress
    const focused = host.contains(document.activeElement) ? (document.activeElement as HTMLElement) : null;
    s.flight.forEach((a) => a.cancel());
    container.appendChild(host);
    focused?.focus({ preventScroll: true }); // moving an element drops its focus

    const landed = () => {
      s.hopping = false;
      s.spot = target;
      setHopping(false);
      setSpot(target);
      const line = SECTION_LINES[target];
      if (target !== SIDE && !s.said.has(target)) {
        s.said.add(target);
        if (line) say(line.text, target);
        if (!calm && !s.asleep) react(line?.reaction ?? "curious");
      } else {
        rest();
      }
    };
    if (calm || !body.current) return landed();

    // Start from where Momo was. If that can't be seen from the new spot
    // (off-screen, or outside a panel that clips), start just past the edge it
    // left by, so it comes back in from that side.
    const area = target === SIDE ? visibleArea(document.body) : visibleArea(container);
    const to = host.getBoundingClientRect();
    const startX = Math.max(area.left - from.width, Math.min(area.right, from.left));
    const startY = Math.max(area.top - from.height, Math.min(area.bottom, from.top));
    const flight = first ? drop() : hop(startX - to.left, startY - to.top);
    s.hopping = true;
    setHopping(true);
    if (!s.busy && !s.asleep) avatar.current?.setExpression("excited");
    const path = host.animate(flight.path, { duration: flight.duration });
    s.flight = [path, body.current.animate(flight.squash, { duration: flight.duration })];
    path.finished.then(landed, () => {}); // a newer move cancels this one
  });

  // Sit on the heading of the section being read while enough of it is on
  // screen; otherwise wait at the side.
  const evaluate = useEffectEvent(() => {
    const s = state.current;
    if (!s.ready) return;
    const ratio = s.ratios.get(active) ?? 0;
    const onHeading = s.spot === active ? ratio >= STAY_RATIO : ratio >= LAND_RATIO;
    moveTo(onHeading ? active : SIDE);
  });
  const schedule = useEffectEvent(() => {
    const s = state.current;
    window.clearTimeout(s.moveTimer);
    s.moveTimer = window.setTimeout(evaluate, host.isConnected ? HOP_DELAY_MS : 0);
  });
  useEffect(() => {
    schedule();
  }, [active]);

  // Track how much of each heading's spot is on screen (below the floating
  // button). IntersectionObserver also accounts for pinned sections and for
  // anything that clips them.
  useEffect(() => {
    const s = state.current;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) s.ratios.set(perchSection(e.target), e.isIntersecting ? e.intersectionRatio : 0);
        s.ready = true;
        schedule();
      },
      { threshold: [0, STAY_RATIO, LAND_RATIO, 1], rootMargin: `-${TOP_CLEARANCE}px 0px 0px 0px` },
    );
    document.querySelectorAll(ALL_PERCHES).forEach((perch) => observer.observe(perch));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.body.appendChild(side);
    const s = state.current;
    return () => {
      window.clearTimeout(s.moveTimer);
      window.clearTimeout(s.bubbleTimer);
      s.flight.forEach((a) => a.cancel());
      host.remove();
      side.remove();
    };
  }, [host, side]);

  // Nap after a while without any activity; wake up on the next one.
  const onActivity = useEffectEvent(() => {
    const s = state.current;
    if (!s.asleep) return;
    s.asleep = false;
    if (calm) rest();
    else react("waking");
    say("Oh! You're back.", s.spot);
  });
  const fallAsleep = useEffectEvent(() => {
    const s = state.current;
    s.asleep = true;
    s.busy = false;
    say("Zzz…", s.spot, null);
    if (calm) avatar.current?.setExpression("sleepy");
    else avatar.current?.play("sleeping");
  });
  useEffect(() => {
    let timer = 0;
    const arm = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(fallAsleep, SLEEP_AFTER_MS);
    };
    const handler = () => {
      onActivity();
      arm();
    };
    const events = ["scroll", "pointermove", "pointerdown", "keydown", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, handler, { passive: true }));
    arm();
    return () => {
      window.clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, handler));
    };
  }, []);

  // Follow the mouse with its eyes while it's nearby.
  const lookDone = useEffectEvent(() => rest());
  useEffect(() => {
    if (calm) return;
    const s = state.current;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || s.asleep || s.busy || s.hopping || !button.current) return;
      const r = button.current.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const distance = Math.hypot(dx, dy);
      if (distance > 340 || distance < 24) return;
      const look: Look = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? "look-left" : "look-right") : dy < 0 ? "look-up" : "look-down";
      if (look !== s.look) {
        s.look = look;
        avatar.current?.setExpression(look);
      }
      window.clearTimeout(s.lookTimer);
      s.lookTimer = window.setTimeout(() => {
        s.look = null;
        lookDone();
      }, 1600);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.clearTimeout(s.lookTimer);
    };
  }, [calm]);

  const onClick = () => {
    const s = state.current;
    if (s.asleep) return; // the pointerdown already woke it up
    react("excited");
    say(TIPS[s.tip % TIPS.length], spot);
    s.tip += 1;
  };

  // The bubble waits until Momo has landed, and stays with its own spot.
  const shown = !hopping && bubble && bubble.spot === spot ? bubble : null;
  const placement = shown?.placement ?? "above";
  const atSide = spot === SIDE;

  return createPortal(
    <div className="relative">
      {/* "wait" swaps one bubble for the next instead of showing both at once. */}
      <AnimatePresence mode="wait">
        {shown && (
          <motion.p
            key={shown.text}
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{ originX: placement === "right" ? 0 : 1, originY: 1 }}
            className={cn(
              "absolute w-max rounded-2xl border bg-background px-3.5 py-2 text-left text-sm leading-snug font-normal tracking-normal text-foreground shadow-md",
              // Above: over Momo's head, clear of the hide button at its corner.
              // Beside: level with Momo, ending just above the heading's letters.
              placement === "above" && "right-5 bottom-full mb-3.5 max-w-[220px]",
              placement === "right" && "left-full bottom-[calc(24%+4px)] ml-2.5 max-w-[220px]",
              placement === "left" && "right-full bottom-[calc(24%+4px)] mr-2 max-w-[200px]",
            )}
          >
            {shown.text}
            {/* The tail points at Momo. */}
            <span
              aria-hidden
              className={cn(
                "absolute size-2.5 rotate-45 bg-background",
                placement === "above" && "right-2.5 -bottom-[5.5px] border-r border-b",
                placement === "right" && "-left-[5.5px] bottom-3.5 border-b border-l",
                placement === "left" && "-right-[5.5px] bottom-3.5 border-t border-r",
              )}
            />
          </motion.p>
        )}
      </AnimatePresence>

      <div className="group relative">
        <button
          ref={button}
          type="button"
          onClick={onClick}
          onMouseEnter={() => {
            const s = state.current;
            if (!s.busy && !s.asleep && !s.hopping) react("shy");
          }}
          aria-label="Momo, the site's sidekick. Click for a tip."
          className="flex rounded-full transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          <div ref={body} className="origin-bottom">
            <Momo
              ref={avatar}
              defaultAnimation={calm ? undefined : "idle"}
              defaultExpression={calm ? "neutral" : undefined}
              size={small ? 56 : 72}
              ariaLabel="Momo"
              onAnimationEnd={() => {
                state.current.busy = false;
                rest();
              }}
            />
          </div>
        </button>

        {/* With a mouse it shows on hover or keyboard focus (not after a click);
            on touch screens it's always shown. At the side of the screen it
            moves to the left corner, since the right one is tucked away. The
            ::before pads the small circle out to a 44px tap target. */}
        <button
          type="button"
          onClick={onHide}
          aria-label="Hide Momo"
          title="Hide Momo"
          className={cn(
            "absolute -top-1 grid size-6 place-items-center rounded-full border bg-background text-muted-foreground shadow-sm transition-opacity duration-200 before:absolute before:-inset-2.5 hover:text-foreground group-hover:opacity-100 group-has-[:focus-visible]:opacity-100 pointer-fine:opacity-0",
            atSide ? "-left-1" : "-right-1",
          )}
        >
          <X className="size-3.5" aria-hidden />
        </button>
      </div>
    </div>,
    host,
  );
}

/** The part of the screen where something inside `el` can be seen: the
 *  viewport, cut down by any ancestor that clips its overflow (like the hero,
 *  which clips sideways for the lanyard). */
function visibleArea(el: HTMLElement) {
  let left = 0;
  let top = 0;
  let right = window.innerWidth;
  let bottom = window.innerHeight;
  for (let node = el.parentElement; node && node !== document.body; node = node.parentElement) {
    const { overflowX, overflowY } = getComputedStyle(node);
    if (overflowX === "visible" && overflowY === "visible") continue;
    const r = node.getBoundingClientRect();
    if (overflowX !== "visible") {
      left = Math.max(left, r.left);
      right = Math.min(right, r.right);
    }
    if (overflowY !== "visible") {
      top = Math.max(top, r.top);
      bottom = Math.min(bottom, r.bottom);
    }
  }
  return { left, top, right, bottom };
}

type Flight = { path: Keyframe[]; squash: Keyframe[]; duration: number };

const CROUCH_MS = 90;
const SETTLE_MS = 260;

/** A hop along an arc from (dx, dy) to the new spot: crouch, stretch on
 *  take-off, squash on landing. */
function hop(dx: number, dy: number): Flight {
  const distance = Math.hypot(dx, dy);
  const air = Math.min(820, 380 + distance * 0.4);
  const lift = Math.min(150, 50 + distance * 0.18); // how far the arc rises above a straight line
  const duration = CROUCH_MS + air + SETTLE_MS;
  const start = CROUCH_MS / duration;
  const land = (CROUCH_MS + air) / duration;
  const at = (t: number) => start + (land - start) * t;

  const path: Keyframe[] = [{ transform: `translate(${dx}px, ${dy}px)`, offset: 0 }];
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    const x = dx * (1 - t);
    const y = dy * (1 - t) - 4 * lift * t * (1 - t);
    path.push({ transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`, offset: at(t) });
  }
  path.push({ transform: "translate(0px, 0px)", offset: 1 });

  const squash: Keyframe[] = [
    { transform: "scale(1, 1)", offset: 0 },
    { transform: "scale(1.1, 0.88)", offset: start }, // crouch
    { transform: "scale(0.92, 1.1)", offset: at(0.18) }, // stretch on take-off
    { transform: "scale(1, 1)", offset: at(0.55) },
    { transform: "scale(0.95, 1.06)", offset: at(0.95) }, // falling
    { transform: "scale(1.15, 0.85)", offset: land }, // squash on landing
    { transform: "scale(0.97, 1.03)", offset: land + (1 - land) / 2 },
    { transform: "scale(1, 1)", offset: 1 },
  ];
  return { path, squash, duration };
}

/** The first appearance: a short drop into place. */
function drop(): Flight {
  const land = 0.62;
  return {
    path: [
      // Ease in, so it speeds up as it falls.
      { transform: "translate(0px, -90px)", opacity: 0, offset: 0, easing: "cubic-bezier(0.55, 0, 1, 0.45)" },
      { transform: "translate(0px, 0px)", opacity: 1, offset: land },
      { transform: "translate(0px, 0px)", opacity: 1, offset: 1 },
    ],
    squash: [
      { transform: "scale(0.94, 1.08)", offset: 0 },
      { transform: "scale(0.95, 1.06)", offset: land - 0.04 },
      { transform: "scale(1.15, 0.85)", offset: land },
      { transform: "scale(0.97, 1.03)", offset: land + (1 - land) / 2 },
      { transform: "scale(1, 1)", offset: 1 },
    ],
    duration: 620,
  };
}
