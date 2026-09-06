import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import {
  ART_HEIGHT,
  ART_WIDTH,
  CAL,
  CHIPS,
  GRID,
  MARKED,
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

// The same drawing as the site's, at rest. Its colours are written out because this renders
// outside the browser, where the palette's custom properties do not exist.
const INK = {
  paper: "#ffffff",
  line: "#d4cec0",
  sunk: "#f4f2ec",
  accent: "#0d7a5c",
  deep: "#085d46",
  gold: "#f5b841",
};

function Illustration({ width }: { width: number }) {
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
        rx={SHEET.r}
        fill={INK.paper}
        stroke={INK.line}
        strokeWidth="2"
      />
      <circle cx={SHEET.x + 30} cy={SHEET.y + 32} r="11" fill={INK.gold} />
      <rect
        x={SHEET.x + 52}
        y={SHEET.y + 26}
        width="62"
        height="10"
        rx="5"
        fill={INK.accent}
      />
      {SHEET_LINES.map((l) => (
        <rect
          key={l.y}
          x={SHEET.x + 20}
          y={SHEET.y + l.y}
          width={l.w}
          height="8"
          rx="4"
          fill={INK.line}
        />
      ))}

      <rect
        x={CAL.x}
        y={CAL.y}
        width={CAL.w}
        height={CAL.h}
        rx={CAL.r}
        fill={INK.paper}
        stroke={INK.line}
        strokeWidth="2"
      />
      <path
        d={`M${CAL.x} ${CAL.y + CAL.r}a${CAL.r} ${CAL.r} 0 0 1 ${CAL.r} -${CAL.r}h${CAL.w - CAL.r * 2}a${CAL.r} ${CAL.r} 0 0 1 ${CAL.r} ${CAL.r}v${CAL.header - CAL.r}h-${CAL.w}z`}
        fill={INK.accent}
      />
      <rect
        x={CAL.x + 40}
        y={CAL.y - 12}
        width="14"
        height="30"
        rx="7"
        fill={INK.deep}
      />
      <rect
        x={CAL.x + CAL.w - 54}
        y={CAL.y - 12}
        width="14"
        height="30"
        rx="7"
        fill={INK.deep}
      />
      {Array.from({ length: GRID.rows }).flatMap((_, row) =>
        Array.from({ length: GRID.cols }).map((_, col) => {
          const b = dayBox(col, row);
          const marked = MARKED.some((m) => m.col === col && m.row === row);
          return (
            <rect
              key={`${row}-${col}`}
              x={b.x}
              y={b.y}
              width={b.size}
              height={b.size}
              rx="7"
              fill={marked ? INK.accent : INK.sunk}
            />
          );
        }),
      )}

      {CHIPS.map((c, i) => (
        <g key={i}>
          <rect
            x={c.x}
            y={c.y}
            width={c.w}
            height={c.h}
            rx="8"
            fill={INK.accent}
          />
          <rect
            x={c.x + 11}
            y={c.y + 9}
            width="26"
            height="5"
            rx="2.5"
            fill="#ffffff"
            opacity="0.92"
          />
          <rect
            x={c.x + 43}
            y={c.y + 9}
            width="14"
            height="5"
            rx="2.5"
            fill="#ffffff"
            opacity="0.6"
          />
          <rect
            x={c.x + 11}
            y={c.y + 19}
            width="40"
            height="5"
            rx="2.5"
            fill="#ffffff"
            opacity="0.55"
          />
        </g>
      ))}
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
      <div style={{ display: "flex", flexDirection: "column", width: 620 }}>
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
            fontSize: 66,
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
        <Illustration width={460} />
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
