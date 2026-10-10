import { ScrollTrigger } from "gsap/ScrollTrigger";

/** Id of the ScrollTrigger that pins a section, so jumps can find where it starts. */
export const pinId = (section: string) => `pin-${section}`;

/**
 * Smoothly scrolls to the section with the given id. A pinned section (like
 * Experience on large screens) is held in place by GSAP while its cards slide,
 * so we scroll to where its pin starts rather than to the element itself.
 */
export function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const pin = ScrollTrigger.getById(pinId(id));
  if (pin) window.scrollTo({ top: pin.start, behavior: "smooth" });
  else el.scrollIntoView({ behavior: "smooth" });
}
