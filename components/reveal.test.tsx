// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, act } from "@testing-library/react";
import { Reveal, TOP_MARGIN } from "./reveal";

type Entry = { isIntersecting: boolean };
type Callback = (entries: Entry[]) => void;
let lastOptions: IntersectionObserverInit | undefined;

function installObserver() {
  const callbacks: Callback[] = [];
  class FakeObserver {
    constructor(cb: Callback, options?: IntersectionObserverInit) {
      callbacks.push(cb);
      lastOptions = options;
    }
    observe() {}
    disconnect() {}
  }
  vi.stubGlobal("IntersectionObserver", FakeObserver);
  return callbacks;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Reveal", () => {
  it("is simply shown where nothing can say whether it is on screen", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    render(<Reveal>hello</Reveal>);
    expect(screen.getByText("hello").className).toBe("reveal");
  });

  it("renders visible, hides only once it knows it is off screen, and arrives when it scrolls in", () => {
    const callbacks = installObserver();
    render(<Reveal>hello</Reveal>);
    const el = screen.getByText("hello");
    expect(el.className).toBe("reveal");

    act(() => callbacks[0]([{ isIntersecting: false }]));
    expect(el.className).toContain("is-out");

    act(() => callbacks[0]([{ isIntersecting: true }]));
    expect(el.className).toContain("is-in");
    expect(el.className).not.toContain("is-out");
  });

  it("counts everything above the viewport as in view, so a jump past a block cannot strand it", () => {
    installObserver();
    render(<Reveal>hello</Reveal>);
    expect(lastOptions?.rootMargin?.startsWith(`${TOP_MARGIN}px`)).toBe(true);
  });

  it("stays put when it is already in view as the page loads", () => {
    const callbacks = installObserver();
    render(<Reveal>hello</Reveal>);
    act(() => callbacks[0]([{ isIntersecting: true }]));
    expect(screen.getByText("hello").className).toBe("reveal");
  });

  it("never moves for a visitor who asked for less motion", () => {
    const callbacks = installObserver();
    vi.stubGlobal("matchMedia", (q: string) => ({
      matches: q.includes("reduced-motion"),
      addEventListener() {},
      removeEventListener() {},
    }));
    render(<Reveal>hello</Reveal>);
    expect(callbacks).toHaveLength(0);
    expect(screen.getByText("hello").className).toBe("reveal");
  });
});
