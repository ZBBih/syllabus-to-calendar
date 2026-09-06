import {
  ART_ALT,
  ART_HEIGHT,
  ART_WIDTH,
  CAL,
  CHIPS,
  CHIP_ORIGIN,
  GRID,
  MARKED,
  SHEET,
  SHEET_LINES,
  dayBox,
} from "@/lib/art";

/**
 * The illustration, whole on the landing page and cropped to one half everywhere else.
 *
 * Drawn rather than shipped as a picture, so it is the same two colours the rest of the page is
 * made of and changes with the theme without a second copy of anything.
 */

function Sheet() {
  return (
    <g className="art-document">
      <rect {...rect(SHEET)} className="art-card" />
      <circle cx={SHEET.x + 30} cy={SHEET.y + 32} r="11" fill="var(--joy-2)" />
      <rect
        x={SHEET.x + 52}
        y={SHEET.y + 26}
        width="62"
        height="10"
        rx="5"
        fill="var(--accent)"
      />
      {SHEET_LINES.map((l) => (
        <rect
          key={l.y}
          x={SHEET.x + 20}
          y={SHEET.y + l.y}
          width={l.w}
          height="8"
          rx="4"
          fill="var(--line-strong)"
        />
      ))}
    </g>
  );
}

function Calendar() {
  return (
    <g className="art-calendar">
      <rect {...rect(CAL)} className="art-card" />
      <path
        d={`M${CAL.x} ${CAL.y + CAL.r}a${CAL.r} ${CAL.r} 0 0 1 ${CAL.r} -${CAL.r}h${CAL.w - CAL.r * 2}a${CAL.r} ${CAL.r} 0 0 1 ${CAL.r} ${CAL.r}v${CAL.header - CAL.r}h-${CAL.w}z`}
        fill="var(--accent)"
      />
      <rect
        x={CAL.x + 40}
        y={CAL.y - 12}
        width="14"
        height="30"
        rx="7"
        fill="var(--accent-strong)"
      />
      <rect
        x={CAL.x + CAL.w - 54}
        y={CAL.y - 12}
        width="14"
        height="30"
        rx="7"
        fill="var(--accent-strong)"
      />
      {Array.from({ length: GRID.rows }).flatMap((_, row) =>
        Array.from({ length: GRID.cols }).map((_, col) => {
          const b = dayBox(col, row);
          return (
            <rect
              key={`${row}-${col}`}
              x={b.x}
              y={b.y}
              width={b.size}
              height={b.size}
              rx="7"
              fill="var(--sunk)"
            />
          );
        }),
      )}
    </g>
  );
}

/** The days that fill in, drawn over the empty grid so each can arrive on its own beat. */
function MarkedDays() {
  return (
    <>
      {MARKED.map((m, i) => {
        const b = dayBox(m.col, m.row);
        return (
          <rect
            key={i}
            x={b.x}
            y={b.y}
            width={b.size}
            height={b.size}
            rx="7"
            fill="var(--accent)"
            className={`art-day art-day${i + 1}`}
          />
        );
      })}
    </>
  );
}

/** A date in transit: the same shape the calendar is about to take, carrying a line of text. */
function Chip({ i }: { i: number }) {
  const c = CHIPS[i];
  return (
    <g
      className={`art-chip art-card${i + 1}`}
      style={
        {
          "--fly-x": `${CHIP_ORIGIN.x - c.x}px`,
          "--fly-y": `${CHIP_ORIGIN.y + i * 34 - c.y}px`,
        } as React.CSSProperties
      }
    >
      <rect
        x={c.x}
        y={c.y}
        width={c.w}
        height={c.h}
        rx="8"
        fill="var(--accent)"
      />
      <rect
        x={c.x + 11}
        y={c.y + 9}
        width="26"
        height="5"
        rx="2.5"
        fill="var(--accent-ink)"
        opacity="0.92"
      />
      <rect
        x={c.x + 43}
        y={c.y + 9}
        width="14"
        height="5"
        rx="2.5"
        fill="var(--accent-ink)"
        opacity="0.6"
      />
      <rect
        x={c.x + 11}
        y={c.y + 19}
        width="40"
        height="5"
        rx="2.5"
        fill="var(--accent-ink)"
        opacity="0.55"
      />
    </g>
  );
}

function rect(b: { x: number; y: number; w: number; h: number; r: number }) {
  return { x: b.x, y: b.y, width: b.w, height: b.h, rx: b.r };
}

/**
 * The hero.
 *
 * The sheet arrives, the calendar arrives, and then the three dates fly the distance from the
 * syllabus to their places, one after another, each arrival colouring in a day. The travel and
 * the fill are the point: a shape fading in where it already sits reads as a picture loading,
 * while a date leaving one object and changing another reads as the product working.
 *
 * It plays once and settles, because a loop next to a call to action competes with it.
 */
export function HeroArt({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${ART_WIDTH} ${ART_HEIGHT}`}
      className={`art-stage w-full ${className}`}
      role="img"
      aria-label={ART_ALT}
    >
      <Sheet />
      <Calendar />
      <MarkedDays />
      {CHIPS.map((_, i) => (
        <Chip key={i} i={i} />
      ))}
    </svg>
  );
}

/** One half of it, squared off, for the smaller spots. */
export function ArtCrop({
  part,
  className = "",
  size = 160,
}: {
  part: "document" | "calendar";
  className?: string;
  size?: number;
}) {
  const box =
    part === "document"
      ? `${SHEET.x - 14} ${SHEET.y - 20} ${SHEET.w + 28} ${SHEET.h + 40}`
      : `${CAL.x - 16} ${CAL.y - 24} ${CAL.w + 32} ${CAL.h + 48}`;
  return (
    <svg
      viewBox={box}
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      {part === "document" ? <Sheet /> : <Calendar />}
      {part === "calendar" && <MarkedDays />}
    </svg>
  );
}
