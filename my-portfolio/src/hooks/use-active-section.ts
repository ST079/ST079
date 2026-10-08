"use client";

import { useEffect, useState } from "react";

/**
 * Returns the id of the section currently under the centre of the screen.
 *
 * Uses a small box in the middle of the viewport (rather than a horizontal
 * band) so it works both when sections stack vertically and when they slide in
 * sideways inside the horizontal scroller. IntersectionObserver accounts for
 * CSS transforms, so GSAP's translated panels are tracked correctly.
 */
export function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-45% -45% -45% -45%" },
    );

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [ids]);

  return active;
}
