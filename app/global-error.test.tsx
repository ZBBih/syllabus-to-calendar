// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import GlobalError from "./global-error";

// next/font only works under Next's compiler; the page only needs the class names to exist.
vi.mock("next/font/google", () => ({
  Instrument_Serif: () => ({ variable: "font-display" }),
  Geist: () => ({ variable: "font-body" }),
}));

afterEach(cleanup);

const boom = () => {
  const e = new Error("undefined is not an object (evaluating 'navigator.foo.bar')") as Error & {
    digest?: string;
  };
  e.stack = `TypeError: undefined is not an object\n    at Reveal (https://syllabify-app.vercel.app/_next/static/chunks/app/page-abc.js:1:2345)\n    at renderWithHooks (react-dom.js:1:1)`;
  e.digest = "1234567890";
  return e;
};

describe("the root error page", () => {
  it("says the app broke, in the app's own words, and offers to reload", () => {
    const retry = vi.fn();
    render(<GlobalError error={boom()} retry={retry} />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toMatch(/could not open/i);
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(retry).toHaveBeenCalledOnce();
  });

  it("prints the error itself so a screenshot is a bug report", () => {
    render(<GlobalError error={boom()} retry={() => {}} />);
    const report = screen.getByLabelText("What went wrong");
    expect(report.textContent).toContain("undefined is not an object (evaluating 'navigator.foo.bar')");
    // The first frames name the component; the deep React internals do not help anyone.
    expect(report.textContent).toContain("at Reveal");
    expect(report.textContent).toContain("1234567890");
  });

  it("copes with an error that is not an Error", () => {
    render(<GlobalError error={"just a string" as unknown as Error} retry={() => {}} />);
    expect(screen.getByLabelText("What went wrong").textContent).toContain("just a string");
  });
});
