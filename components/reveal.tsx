"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "@/lib/motion";

/**
 * A wrapper that arrives when it is scrolled into view: it rises a little and fades in, once.
 *
 * It is a hint, not a gate. The server renders it visible, so without JavaScript nothing is
 * ever hidden. Only once the browser can say the block is off screen is it tucked down and
 * faded, to arrive when it scrolls in; a block already in view when the page loads simply
 * stays. A visitor who asked for less motion never sees it move. The look lives in
 * globals.css under `.reveal`; children of a `.reveal-group` inside arrive one after another.
 */
type Phase = "shown" | "waiting" | "in";

/** Pixels above the viewport that still count as "in view". Larger than any page. */
export const TOP_MARGIN = 1_000_000;

export function Reveal({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>("shown");
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced || typeof IntersectionObserver === "undefined") return;
    let settled = false;
    const io = new IntersectionObserver(
      (entries) => {
        if (settled) return;
        if (entries.some((e) => e.isIntersecting)) {
          settled = true;
          setPhase((p) => (p === "waiting" ? "in" : p));
          io.disconnect();
        } else {
          setPhase("waiting");
        }
      },
      // The top margin is effectively infinite: anything above the viewport counts as in
      // view, so a visitor who jumps to the foot of the page never finds the middle of it
      // missing. An observer only reports crossings, and a block that goes from below the
      // screen to above it in one jump crosses nothing.
      { threshold: 0.05, rootMargin: `${TOP_MARGIN}px 0px -5% 0px` },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  const mark = phase === "waiting" ? "is-out" : phase === "in" ? "is-in" : "";
  return (
    <div
      ref={ref}
      className={`reveal ${mark} ${className}`.replace(/\s+/g, " ").trim()}
    >
      {children}
    </div>
  );
}
