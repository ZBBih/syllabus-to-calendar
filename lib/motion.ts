import { useSyncExternalStore } from "react";

/**
 * Whether the visitor has asked their system for less motion.
 *
 * Asked as a question on every render rather than answered once into state, so a component
 * follows the setting if it changes mid-visit and nothing has to be written from inside an
 * effect. On the server, and on the first client render, the answer is "no", so hydration has
 * nothing to disagree about; the stylesheet already holds every animation still under the
 * same media query, so the one render before the real answer arrives cannot move anything.
 */
const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  if (typeof window.matchMedia !== "function") return () => {};
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

const now = () =>
  typeof window.matchMedia === "function" && window.matchMedia(QUERY).matches;
const onServer = () => false;

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, now, onServer);
}
