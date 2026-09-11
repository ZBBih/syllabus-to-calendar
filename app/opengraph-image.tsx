import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import {
  ARROWS,
  ART_HEIGHT,
  ART_WIDTH,
  CAL,
  FILLED,
  GRID,
  SHEET,
  SHEET_LINES,
  dayBox,
} from "@/lib/art";

export const alt =
  "Syllabify: every deadline on your calendar, without an account";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The renderer cannot reach the network at build time, so the display faces are read off disk.
// Without them the heading falls back to a system sans, which is not the face the site uses and
// makes a shared link look like a different product. They sit under app/ so they are not served
// as public assets.
const display = readFileSync(join(process.cwd(), "app", "og-display.ttf"));
const displayItalic = readFileSync(
  join(process.cwd(), "app", "og-display-italic.ttf"),
);
const sans = readFileSync(join(process.cwd(), "app", "og-sans-400.ttf"));
const sansBold = readFileSync(join(process.cwd(), "app", "og-sans-600.ttf"));

/*
  The card is the front page in miniature: the green block on the paper, the headline with its
  amber italic line, the white button, and the picture in the same joy colours it wears on the
  hero. Every colour is a literal because this renders outside a browser, where the palette's
  custom properties do not exist. The values are the light theme's.
*/
const PAPER = "#fbfaf7";
const GREEN = "#0d7a5c";
const GREEN_DEEP = "#085d46";
const WHITE = "#ffffff";
const HERO_MUTED = "#eaf7f0";
const AMBER = "#f7cd6e";
const ART_LINE = "#cfe9dd";
const ART_SUNK = "#eef5f1";
const JOY = ["#f5b841", "#ef6f4c", "#3d8bd8", GREEN, GREEN];

/**
 * The same drawing as the hero's, at rest: the dates have landed, the flight paths remain.
 *
 * It is drawn here rather than by importing the component because the renderer will not take the
 * component's markup, which groups and labels things for animation it has no notion of. Both draw
 * from the constants in lib/art, so the geometry cannot drift even though the markup differs.
 */
function Illustration({ width }: { width: number }) {
  const cells = [];
  for (let row = 0; row < GRID.rows; row++) {
    for (let col = 0; col < GRID.cols; col++) {
      const b = dayBox(col, row);
      const hit = FILLED.find((f) => f.col === col && f.row === row);
      cells.push(
        <rect
          key={`${row}-${col}`}
          x={b.x}
          y={b.y}
          width={b.size}
          height={b.size}
          rx="4"
          fill={hit ? JOY[hit.order] : ART_SUNK}
        />,
      );
    }
  }
  return (
    <svg
      width={width}
      height={(width * ART_HEIGHT) / ART_WIDTH}
      viewBox={`0 0 ${ART_WIDTH} ${ART_HEIGHT}`}
    >
      <rect
        x={SHEET.x}
        y={SHEET.y}
        width={SHEET.w}
        height={SHEET.h}
        rx="8"
        fill={WHITE}
        stroke={ART_LINE}
        strokeWidth="1.5"
      />
      <rect
        x={SHEET.x + 14}
        y={SHEET.y + 14}
        width="42"
        height="7"
        rx="3.5"
        fill={GREEN}
      />
      {SHEET_LINES.map((l) => (
        <rect
          key={l.y}
          x={SHEET.x + 14}
          y={SHEET.y + l.y + 12}
          width={l.w}
          height="5"
          rx="2.5"
          fill={ART_LINE}
        />
      ))}
      <rect
        x={SHEET.x + 14}
        y={SHEET.y + 112}
        width="34"
        height="5"
        rx="2.5"
        fill={GREEN}
        opacity="0.55"
      />
      <rect
        x={SHEET.x + 14}
        y={SHEET.y + 124}
        width="52"
        height="5"
        rx="2.5"
        fill={ART_LINE}
      />

      {ARROWS.map((a, i) => (
        <path
          key={i}
          d={a.d}
          fill="none"
          stroke="rgba(255,255,255,0.8)"
          strokeWidth="1.75"
          strokeDasharray="4 5"
        />
      ))}

      <rect
        x={CAL.x}
        y={CAL.y}
        width={CAL.w}
        height={CAL.h}
        rx="10"
        fill={WHITE}
        stroke={ART_LINE}
        strokeWidth="1.5"
      />
      <path
        d={`M${CAL.x} ${CAL.y + 10}a10 10 0 0 1 10 -10h${CAL.w - 20}a10 10 0 0 1 10 10v${CAL.header - 10}H${CAL.x}z`}
        fill={GREEN}
      />
      <rect
        x={CAL.x + 22}
        y={CAL.y - 10}
        width="8"
        height="20"
        rx="4"
        fill={GREEN_DEEP}
      />
      <rect
        x={CAL.x + CAL.w - 30}
        y={CAL.y - 10}
        width="8"
        height="20"
        rx="4"
        fill={GREEN_DEEP}
      />
      {cells}
    </svg>
  );
}

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        padding: 28,
        background: PAPER,
        fontFamily: "Instrument Serif",
      }}
    >
      <div
        style={{
          display: "flex",
          flex: 1,
          alignItems: "center",
          padding: "0 64px",
          borderRadius: 40,
          background: GREEN,
          color: WHITE,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", width: 600 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <svg width="40" height="40" viewBox="0 0 64 64">
              <rect width="64" height="64" rx="16" fill={WHITE} />
              <rect x="11" y="17" width="42" height="36" rx="7" fill={GREEN} />
              <rect x="19" y="9" width="6" height="14" rx="3" fill={GREEN} />
              <rect x="39" y="9" width="6" height="14" rx="3" fill={GREEN} />
              <path
                d="M21 36 L29 44 L44 26"
                fill="none"
                stroke={WHITE}
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div style={{ fontSize: 32, letterSpacing: -0.5 }}>Syllabify</div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 66,
              lineHeight: 0.98,
              letterSpacing: -2,
              marginTop: 30,
            }}
          >
            <div>Your whole semester,</div>
            <div>on your calendar,</div>
            <div style={{ fontStyle: "italic", color: AMBER }}>
              in one minute.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginTop: 32,
              fontFamily: "Geist",
              fontSize: 21,
              fontWeight: 600,
            }}
          >
            <div
              style={{
                display: "flex",
                padding: "13px 22px",
                borderRadius: 12,
                background: WHITE,
                color: GREEN,
              }}
            >
              Add my syllabi →
            </div>
            <div
              style={{
                display: "flex",
                padding: "11px 20px",
                borderRadius: 12,
                border: `2px solid rgba(255,255,255,0.45)`,
                color: WHITE,
              }}
            >
              See it on a sample
            </div>
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 22,
              fontFamily: "Geist",
              fontSize: 17,
              color: HERO_MUTED,
            }}
          >
            No account. Nothing uploaded. Free.
          </div>
        </div>

        <div style={{ display: "flex", flex: 1, justifyContent: "flex-end" }}>
          <Illustration width={400} />
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        {
          name: "Instrument Serif",
          data: display,
          weight: 400,
          style: "normal",
        },
        {
          name: "Instrument Serif",
          data: displayItalic,
          weight: 400,
          style: "italic",
        },
        { name: "Geist", data: sans, weight: 400, style: "normal" },
        { name: "Geist", data: sansBold, weight: 600, style: "normal" },
      ],
    },
  );
}
