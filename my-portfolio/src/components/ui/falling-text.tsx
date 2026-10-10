"use client";

import { useEffect, useEffectEvent, useRef, useState, type ReactNode } from "react";
import Matter from "matter-js";

import { cn } from "@/lib/utils";

// Adapted from React Bits <FallingText /> (https://reactbits.dev).
// Changes from the original:
// - words are rendered by React (no innerHTML), `highlightClassName` and
//   `wordSpacing` actually apply;
// - one fixed-step physics loop (the original stepped the engine twice a frame);
// - the box no longer swallows the mouse wheel, and on touch screens it doesn't
//   block page scrolling (dragging is mouse-only);
// - the debug canvas is only created when `wireframes` is on;
// - it can drop any elements (`items`, e.g. logo tiles), not just words, with
//   rounded bodies to match rounded tiles (`chamfer`).

/** Something to drop instead of a word. */
export interface FallingItem {
  key: string;
  node: ReactNode;
  /** Tooltip (the item itself may have no text). */
  label?: string;
}

export interface FallingTextProps {
  /** Words are split on regular spaces; use non-breaking spaces to keep phrases together. */
  text?: string;
  /** Elements to drop instead of words. */
  items?: FallingItem[];
  /** Corner radius of the physics bodies, for rounded items (px). */
  chamfer?: number;
  /** Bounciness, 0 to 1. */
  restitution?: number;
  /** Words (or word prefixes) to highlight. */
  highlightWords?: string[];
  highlightClassName?: string;
  /** Classes for every word (e.g. to render them as chips). */
  wordClassName?: string;
  /** What starts the fall. */
  trigger?: "auto" | "scroll" | "click" | "hover";
  /** Start the fall from outside (e.g. a button), whatever the trigger. */
  active?: boolean;
  backgroundColor?: string;
  /** Draw the physics bodies (debugging). */
  wireframes?: boolean;
  gravity?: number;
  mouseConstraintStiffness?: number;
  fontSize?: string;
  wordSpacing?: string;
  className?: string;
  /** Called once, when the words start to fall. */
  onStart?: () => void;
}

// Matter.Mouse keeps its DOM handlers on the instance; they aren't in the types.
type MouseHandlers = Record<"mousemove" | "mousedown" | "mouseup" | "mousewheel", EventListener>;

export default function FallingText({
  text = "",
  items,
  chamfer = 0,
  restitution = 0.8,
  highlightWords = [],
  highlightClassName = "font-bold text-cyan-500",
  wordClassName,
  trigger = "auto",
  active = false,
  backgroundColor = "transparent",
  wireframes = false,
  gravity = 1,
  mouseConstraintStiffness = 0.2,
  fontSize = "1rem",
  wordSpacing = "2px",
  className,
  onStart,
}: FallingTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [triggered, setTriggered] = useState(trigger === "auto");
  const started = triggered || active;
  const notifyStart = useEffectEvent(() => onStart?.());

  const words = text.split(" ");

  // "scroll": start when the box comes into view.
  useEffect(() => {
    if (trigger !== "scroll" || started || !containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTriggered(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [trigger, started]);

  useEffect(() => {
    if (!started) return;
    const container = containerRef.current;
    const textEl = textRef.current;
    if (!container || !textEl) return;
    const box = container.getBoundingClientRect();
    if (box.width <= 0 || box.height <= 0) return;
    notifyStart();

    const { Engine, Bodies, Body, Composite, Mouse, MouseConstraint, Render } = Matter;
    const engine = Engine.create();
    engine.gravity.y = gravity;

    // Walls just outside the box.
    const wall = { isStatic: true, render: { fillStyle: "transparent" } };
    const { width, height } = box;
    Composite.add(engine.world, [
      Bodies.rectangle(width / 2, height + 25, width, 50, wall),
      Bodies.rectangle(-25, height / 2, 50, height, wall),
      Bodies.rectangle(width + 25, height / 2, 50, height, wall),
      Bodies.rectangle(width / 2, -25, width, 50, wall),
    ]);

    // One body per word, starting exactly where the word is now.
    const words = Array.from(textEl.querySelectorAll<HTMLSpanElement>("[data-word]")).map((el) => {
      const r = el.getBoundingClientRect();
      const body = Bodies.rectangle(r.left - box.left + r.width / 2, r.top - box.top + r.height / 2, r.width, r.height, {
        render: { fillStyle: "transparent" },
        restitution,
        frictionAir: 0.01,
        friction: 0.2,
        ...(chamfer ? { chamfer: { radius: Math.min(chamfer, r.width / 2, r.height / 2) } } : {}),
      });
      Body.setVelocity(body, { x: (Math.random() - 0.5) * 5, y: 0 });
      Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.05);
      return { el, body };
    });
    Composite.add(engine.world, words.map((w) => w.body));
    for (const { el, body } of words) {
      el.style.position = "absolute";
      el.style.left = `${body.position.x}px`;
      el.style.top = `${body.position.y}px`;
      el.style.transform = "translate(-50%, -50%)";
    }

    // Drag and throw with the mouse. Touch is left alone so the page still scrolls.
    let mouse: Matter.Mouse | null = null;
    if (window.matchMedia("(pointer: fine)").matches) {
      mouse = Mouse.create(container);
      const handlers = mouse as unknown as MouseHandlers;
      container.removeEventListener("wheel", handlers.mousewheel);
      container.removeEventListener("touchmove", handlers.mousemove);
      container.removeEventListener("touchstart", handlers.mousedown);
      container.removeEventListener("touchend", handlers.mouseup);
      Composite.add(
        engine.world,
        MouseConstraint.create(engine, {
          mouse,
          constraint: { stiffness: mouseConstraintStiffness, render: { visible: false } },
        }),
      );
    }

    let render: Matter.Render | null = null;
    if (wireframes && canvasRef.current) {
      render = Render.create({
        element: canvasRef.current,
        engine,
        options: { width, height, background: backgroundColor, wireframes: true },
      });
      Render.run(render);
    }

    let frame = 0;
    let last = performance.now();
    const loop = (now: number) => {
      Engine.update(engine, Math.min(now - last, 1000 / 30));
      last = now;
      for (const { el, body } of words) {
        el.style.left = `${body.position.x}px`;
        el.style.top = `${body.position.y}px`;
        el.style.transform = `translate(-50%, -50%) rotate(${body.angle}rad)`;
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      if (render) {
        Render.stop(render);
        render.canvas.remove();
      }
      if (mouse) {
        const handlers = mouse as unknown as MouseHandlers;
        container.removeEventListener("mousemove", handlers.mousemove);
        container.removeEventListener("mousedown", handlers.mousedown);
        container.removeEventListener("mouseup", handlers.mouseup);
      }
      Composite.clear(engine.world, false);
      Engine.clear(engine);
    };
  }, [started, gravity, wireframes, backgroundColor, mouseConstraintStiffness, restitution, chamfer]);

  const start = () => {
    if (!started && (trigger === "click" || trigger === "hover")) setTriggered(true);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative h-full w-full overflow-hidden pt-8 text-center",
        started ? "cursor-grab active:cursor-grabbing" : (trigger === "click" || trigger === "hover") && "cursor-pointer",
        className,
      )}
      onClick={trigger === "click" ? start : undefined}
      onMouseEnter={trigger === "hover" ? start : undefined}
      style={{ backgroundColor }}
    >
      <div ref={textRef} className="inline-block" style={{ fontSize, lineHeight: 1.4 }}>
        {items
          ? items.map((item) => (
              <span
                key={item.key}
                data-word
                title={item.label}
                className={cn("inline-block select-none align-middle", wordClassName)}
                style={{ marginInline: wordSpacing }}
              >
                {item.node}
              </span>
            ))
          : words.map((word, i) => (
              <span
                key={`${word}-${i}`}
                data-word
                className={cn(
                  "inline-block select-none whitespace-nowrap",
                  wordClassName,
                  highlightWords.some((h) => word.startsWith(h)) && highlightClassName,
                )}
                style={{ marginInline: wordSpacing }}
              >
                {word}
              </span>
            ))}
      </div>
      {wireframes && <div ref={canvasRef} className="pointer-events-none absolute left-0 top-0 z-0" />}
    </div>
  );
}
