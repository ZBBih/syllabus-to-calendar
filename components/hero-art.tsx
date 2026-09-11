"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "@/lib/motion";
import {
  ARROWS,
  ART_ALT,
  ART_HEIGHT,
  ART_WIDTH,
  CAL,
  CHIP,
  CROP,
  FILLED,
  GRID,
  HERO_INK,
  JOY,
  SHEET,
  SHEET_LINES,
  THEME_INK,
  dayBox,
  type ArtInk,
  type ArtPart,
} from "@/lib/art";

/**
 * The landing illustration: a syllabus on the left, a calendar on the right, dates flying
 * across between them and a day filling in for each one that lands.
 *
 * It is a single inline SVG rather than an image so it inherits the theme colours, weighs
 * nothing, and stays sharp at any size. Every bit of the animation is CSS on classes defined
 * in globals.css, which is also where it all gets switched off for reduced motion.
 *
 * The sequence plays on load, rests, and plays again every REPLAY_EVERY milliseconds, so the
 * picture is never a still beside the call to action for long. The rest is most of the
 * period: the flight itself is about two seconds. Replaying is a remount of the animated
 * parts, which restarts their CSS animations without any of the timing living in JavaScript.
 *
 * The parts take their colours as a parameter and can be drawn still, which is what lets the
 * cropped halves reuse them without inheriting an animation they have no room for.
 */

function Sheet({ ink, still }: { ink: ArtInk; still?: boolean }) {
  return (
    <g className="art-paper">
      <rect
        x={SHEET.x}
        y={SHEET.y}
        width={SHEET.w}
        height={SHEET.h}
        rx="8"
        fill={ink.surface}
        stroke={ink.line}
        strokeWidth="1.5"
      />
      <rect
        x={SHEET.x + 14}
        y={SHEET.y + 14}
        width="42"
        height="7"
        rx="3.5"
        fill={ink.accent}
      />
      {SHEET_LINES.map((l, i) => (
        <rect
          key={l.y}
          x={SHEET.x + 14}
          y={SHEET.y + l.y + 12}
          width={l.w}
          height="5"
          rx="2.5"
          fill={ink.line}
          className={still ? undefined : `art-line art-line-${i}`}
        />
      ))}
      <rect
        x={SHEET.x + 14}
        y={SHEET.y + 112}
        width="34"
        height="5"
        rx="2.5"
        fill={ink.accent}
        opacity="0.55"
      />
      <rect
        x={SHEET.x + 14}
        y={SHEET.y + 124}
        width="52"
        height="5"
        rx="2.5"
        fill={ink.line}
      />
    </g>
  );
}

/**
 * The flight paths, drawn just ahead of the date that follows each one. On the theme ground
 * they are the hairline colour; on the hero block, white.
 */
function Arrows({ ink, still }: { ink: ArtInk; still?: boolean }) {
  return (
    <g className="art-paths">
      <defs>
        <marker
          id="art-arrowhead"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M0 0L10 5L0 10z" fill={ink.arrow} />
        </marker>
      </defs>
      {ARROWS.map((a, i) => (
        <path
          key={i}
          d={a.d}
          fill="none"
          stroke={ink.arrow}
          strokeWidth="1.75"
          strokeDasharray="4 5"
          markerEnd="url(#art-arrowhead)"
          className={still ? undefined : `art-arrow art-arrow-${i}`}
        />
      ))}
    </g>
  );
}

function Chips({
  ink,
  still,
  joy,
}: {
  ink: ArtInk;
  still?: boolean;
  joy?: boolean;
}) {
  return (
    <g className="art-flight">
      {[0, 1, 2].map((i) => (
        <g key={i} className={still ? undefined : `art-chip art-chip-${i}`}>
          <rect
            x={CHIP.x}
            y={CHIP.y}
            width={CHIP.w}
            height={CHIP.h}
            rx="6"
            fill={joy ? JOY[i] : ink.accent}
          />
          <rect
            x={CHIP.x + 7}
            y={CHIP.y + 7}
            width="18"
            height="3"
            rx="1.5"
            fill={ink.ink}
            opacity="0.9"
          />
          <rect
            x={CHIP.x + 29}
            y={CHIP.y + 7}
            width="8"
            height="3"
            rx="1.5"
            fill={ink.ink}
            opacity="0.6"
          />
          <rect
            x={CHIP.x + 7}
            y={CHIP.y + 13}
            width="26"
            height="3"
            rx="1.5"
            fill={ink.ink}
            opacity="0.55"
          />
        </g>
      ))}
    </g>
  );
}

function Calendar({
  ink,
  still,
  joy,
}: {
  ink: ArtInk;
  still?: boolean;
  joy?: boolean;
}) {
  return (
    <g className="art-cal">
      <rect
        x={CAL.x}
        y={CAL.y}
        width={CAL.w}
        height={CAL.h}
        rx="10"
        fill={ink.surface}
        stroke={ink.line}
        strokeWidth="1.5"
      />
      <path
        d={`M${CAL.x} ${CAL.y + 10}a10 10 0 0 1 10 -10h${CAL.w - 20}a10 10 0 0 1 10 10v${CAL.header - 10}H${CAL.x}z`}
        fill={ink.accent}
      />
      <rect
        x={CAL.x + 22}
        y={CAL.y - 10}
        width="8"
        height="20"
        rx="4"
        fill={ink.deep}
      />
      <rect
        x={CAL.x + CAL.w - 30}
        y={CAL.y - 10}
        width="8"
        height="20"
        rx="4"
        fill={ink.deep}
      />
      {Array.from({ length: GRID.rows }).flatMap((_, row) =>
        Array.from({ length: GRID.cols }).map((_, col) => {
          const b = dayBox(col, row);
          const hit = FILLED.find((f) => f.col === col && f.row === row);
          return (
            <g key={`${row}-${col}`}>
              <rect
                x={b.x}
                y={b.y}
                width={b.size}
                height={b.size}
                rx="4"
                fill={ink.sunk}
              />
              {hit && (
                <rect
                  x={b.x}
                  y={b.y}
                  width={b.size}
                  height={b.size}
                  rx="4"
                  fill={joy ? (JOY[hit.order] ?? ink.accent) : ink.accent}
                  className={
                    still ? undefined : `art-cell art-cell-${hit.order}`
                  }
                />
              )}
            </g>
          );
        }),
      )}
    </g>
  );
}

/**
 * `onHero` draws it for the green block: white paper, white flight paths, and the dates in
 * the joy colours so the three of them can be told apart in the air and on the calendar.
 */
/** How often the flight plays again, in milliseconds. About six seconds of rest after it. */
export const REPLAY_EVERY = 8000;

export function HeroArt({
  className = "",
  onHero = false,
}: {
  className?: string;
  onHero?: boolean;
}) {
  const ink = onHero ? HERO_INK : THEME_INK;
  const reduced = useReducedMotion();
  const [run, setRun] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => {
      // A tab that is not being looked at is not owed a replay.
      if (
        typeof document !== "undefined" &&
        document.visibilityState === "hidden"
      )
        return;
      setRun((r) => r + 1);
    }, REPLAY_EVERY);
    return () => clearInterval(id);
  }, [reduced]);

  return (
    <svg
      viewBox={`0 0 ${ART_WIDTH} ${ART_HEIGHT}`}
      className={`hero-art w-full ${className}`}
      role="img"
      aria-label={ART_ALT}
      data-run={run}
    >
      <g key={run}>
        <Sheet ink={ink} />
        <Arrows ink={ink} />
        <Chips ink={ink} joy={onHero} />
        <Calendar ink={ink} joy={onHero} />
      </g>
    </svg>
  );
}

/**
 * One half of the same drawing, still, for the classes screen, the export payoff and the 404.
 *
 * It is a viewBox onto the hero rather than art of its own, so the two can never drift apart.
 */
export function ArtCrop({
  part,
  className = "",
  size = 160,
}: {
  part: ArtPart;
  className?: string;
  size?: number;
}) {
  return (
    <svg
      viewBox={CROP[part]}
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      {part === "document" ? (
        <Sheet ink={THEME_INK} still />
      ) : (
        <Calendar ink={THEME_INK} still />
      )}
    </svg>
  );
}
