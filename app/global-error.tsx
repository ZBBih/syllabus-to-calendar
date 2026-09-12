"use client";

import { Instrument_Serif, Geist } from "next/font/google";
import "./globals.css";
import { EMAIL } from "@/components/site-links";

// The root error page replaces the whole document, so it brings its own fonts and stylesheet.
const display = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});
const body = Geist({ variable: "--font-body", subsets: ["latin"] });

/** How many frames of the stack to show: enough to name the component, not the React internals. */
const FRAMES = 4;

/**
 * What to print about an error so that a screenshot of this page is a usable bug report.
 *
 * The app has no server and no error reporting, so the only way a crash on a phone ever
 * reaches anyone is the person on the phone describing it. Next's default page says "This page
 * couldn't load" and nothing else, which is how a broken link on LinkedIn cost a day. The
 * message and the first few frames are what an engineer would ask for first; the digest is
 * what Next would ask for. None of it is secret: this is a client-only app whose whole source
 * is public.
 */
export function describeError(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  const digest = (error as { digest?: string }).digest;
  const frames = (error.stack ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("at ") || /@|:\d+:\d+/.test(l))
    .slice(0, FRAMES);
  return [
    `${error.name}: ${error.message}`,
    ...frames,
    digest ? `digest ${digest}` : "",
    process.env.NEXT_PUBLIC_BUILD_STAMP ? `build ${process.env.NEXT_PUBLIC_BUILD_STAMP}` : "",
    typeof navigator === "undefined" ? "" : navigator.userAgent,
  ]
    .filter(Boolean)
    .join("\n");
}

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} font-sans antialiased`}>
        <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center px-6 py-12 text-center">
          <h1 className="h1">Syllabify could not open.</h1>
          <p className="lede mx-auto mt-4">
            Something in this browser stopped the page before it could draw. Nothing you had in
            progress is lost: your classes are saved in this browser, not on a server.
          </p>
          <button type="button" onClick={() => retry()} className="btn btn-primary btn-hero mt-8">
            Try again
          </button>
          <p className="mt-8 text-xs text-muted">
            If it keeps happening, a screenshot of this page sent to{" "}
            <a href={`mailto:${EMAIL}`} className="underline">
              {EMAIL}
            </a>{" "}
            is everything needed to fix it.
          </p>
          <pre
            aria-label="What went wrong"
            className="mt-4 w-full overflow-x-auto whitespace-pre-wrap break-words rounded-md border border-line bg-sunk p-3 text-left font-mono text-[11px] leading-5 text-muted"
          >
            {describeError(error)}
          </pre>
        </main>
      </body>
    </html>
  );
}
