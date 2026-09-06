import {
  ART_ALT,
  ART_HEIGHT,
  ART_WIDTH,
  CAL,
  CHIP,
  CROP,
  FILLED,
  GRID,
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
 * The sequence runs once on load and then holds still, because a loop beside a call to action
 * competes with it for attention.
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
          className={still ? undefined : "art-line"}
          style={still ? undefined : { animationDelay: `${i * 90}ms` }}
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

function Chips({ ink, still }: { ink: ArtInk; still?: boolean }) {
  return (
    <g className="art-flight">
      {[0, 1, 2].map((i) => (
        <g
          key={i}
          className={still ? undefined : "art-chip"}
          style={still ? undefined : { animationDelay: `${350 + i * 430}ms` }}
        >
          <rect
            x={CHIP.x}
            y={CHIP.y}
            width={CHIP.w}
            height={CHIP.h}
            rx="6"
            fill={ink.accent}
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

function Calendar({ ink, still }: { ink: ArtInk; still?: boolean }) {
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
                  fill={ink.accent}
                  className={still ? undefined : "art-cell"}
                  style={
                    still
                      ? undefined
                      : { animationDelay: `${900 + hit.order * 260}ms` }
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

export function HeroArt({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${ART_WIDTH} ${ART_HEIGHT}`}
      className={`hero-art w-full ${className}`}
      role="img"
      aria-label={ART_ALT}
    >
      <Sheet ink={THEME_INK} />
      <Chips ink={THEME_INK} />
      <Calendar ink={THEME_INK} />
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
