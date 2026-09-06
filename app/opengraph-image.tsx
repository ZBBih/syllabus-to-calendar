import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import {
  ART_HEIGHT,
  ART_WIDTH,
  CAL,
  CHIP,
  FILLED,
  GRID,
  LIGHT_INK as INK,
  SHEET,
  SHEET_LINES,
  dayBox,
} from "@/lib/art";

export const alt =
  "Syllabify: every deadline on your calendar, without an account";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The renderer cannot reach the network at build time, so the display face is read off disk.
// Without it the heading falls back to a system sans, which is not the face the site uses and
// makes a shared link look like a different product. It sits under app/ so it is not served as a
// public asset.
const display = readFileSync(join(process.cwd(), "app", "og-display.ttf"));

/**
 * The same drawing as the site's, at rest.
 *
 * It is drawn here rather than by importing the component for two reasons. This renders outside
 * a browser, where the palette's custom properties do not exist, so every colour has to be a
 * literal; and the renderer will not take the component's markup, which groups and labels things
 * for animation it has no notion of. Both draw from the constants in lib/art, so the geometry
 * cannot drift even though the markup differs.
 */
function Illustration({ width }: { width: number }) {
  const cells = [];
  for (let row = 0; row < GRID.rows; row++) {
    for (let col = 0; col < GRID.cols; col++) {
      const b = dayBox(col, row);
      const on = FILLED.some((f) => f.col === col && f.row === row);
      cells.push(
        <rect
          key={`${row}-${col}`}
          x={b.x}
          y={b.y}
          width={b.size}
          height={b.size}
          rx="4"
          fill={on ? INK.accent : INK.sunk}
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
        fill={INK.surface}
        stroke={INK.line}
        strokeWidth="1.5"
      />
      <rect
        x={SHEET.x + 14}
        y={SHEET.y + 14}
        width="42"
        height="7"
        rx="3.5"
        fill={INK.accent}
      />
      {SHEET_LINES.map((l) => (
        <rect
          key={l.y}
          x={SHEET.x + 14}
          y={SHEET.y + l.y + 12}
          width={l.w}
          height="5"
          rx="2.5"
          fill={INK.line}
        />
      ))}
      <rect
        x={SHEET.x + 14}
        y={SHEET.y + 112}
        width="34"
        height="5"
        rx="2.5"
        fill={INK.accent}
        opacity="0.55"
      />
      <rect
        x={SHEET.x + 14}
        y={SHEET.y + 124}
        width="52"
        height="5"
        rx="2.5"
        fill={INK.line}
      />

      <rect
        x={CHIP.x}
        y={CHIP.y}
        width={CHIP.w}
        height={CHIP.h}
        rx="6"
        fill={INK.accent}
      />
      <rect
        x={CHIP.x + 7}
        y={CHIP.y + 7}
        width="18"
        height="3"
        rx="1.5"
        fill={INK.ink}
        opacity="0.9"
      />
      <rect
        x={CHIP.x + 29}
        y={CHIP.y + 7}
        width="8"
        height="3"
        rx="1.5"
        fill={INK.ink}
        opacity="0.6"
      />
      <rect
        x={CHIP.x + 7}
        y={CHIP.y + 13}
        width="26"
        height="3"
        rx="1.5"
        fill={INK.ink}
        opacity="0.55"
      />

      <rect
        x={CAL.x}
        y={CAL.y}
        width={CAL.w}
        height={CAL.h}
        rx="10"
        fill={INK.surface}
        stroke={INK.line}
        strokeWidth="1.5"
      />
      <path
        d={`M${CAL.x} ${CAL.y + 10}a10 10 0 0 1 10 -10h${CAL.w - 20}a10 10 0 0 1 10 10v${CAL.header - 10}H${CAL.x}z`}
        fill={INK.accent}
      />
      <rect
        x={CAL.x + 22}
        y={CAL.y - 10}
        width="8"
        height="20"
        rx="4"
        fill={INK.deep}
      />
      <rect
        x={CAL.x + CAL.w - 30}
        y={CAL.y - 10}
        width="8"
        height="20"
        rx="4"
        fill={INK.deep}
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
        alignItems: "center",
        padding: "0 72px",
        background: "#fbfaf7",
        color: "#191813",
        fontFamily: "Instrument Serif",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", width: 566 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <svg width="46" height="46" viewBox="0 0 64 64">
            <rect width="64" height="64" rx="16" fill="#0d7a5c" />
            <rect x="11" y="17" width="42" height="36" rx="7" fill="#ffffff" />
            <rect x="19" y="9" width="6" height="14" rx="3" fill="#ffffff" />
            <rect x="39" y="9" width="6" height="14" rx="3" fill="#ffffff" />
            <path
              d="M21 36 L29 44 L44 26"
              fill="none"
              stroke="#0d7a5c"
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div style={{ fontSize: 34, letterSpacing: -0.5 }}>Syllabify</div>
        </div>

        <div
          style={{
            fontSize: 60,
            lineHeight: 1.04,
            letterSpacing: -2,
            marginTop: 26,
          }}
        >
          Your whole semester, on your calendar, in one minute.
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            marginTop: 30,
            fontFamily: "sans-serif",
            fontSize: 20,
          }}
        >
          {["No account", "Nothing uploaded", "Free"].map((t) => (
            <div
              key={t}
              style={{
                display: "flex",
                padding: "9px 16px",
                borderRadius: 9,
                background: "#ddf2ea",
                color: "#0d7a5c",
                fontWeight: 600,
              }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, justifyContent: "flex-end" }}>
        <Illustration width={430} />
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
      ],
    },
  );
}
