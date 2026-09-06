/**
 * The illustration's geometry and palette.
 *
 * The drawing itself is components/hero-art.tsx. What lives here is the data it is built from,
 * so the link preview can draw the same shapes and the tests can check them without rendering
 * anything.
 *
 * A generated cut-paper render was built out fully in place of this and is in git history. It
 * looked good on its own and wrong on the page: a photograph of textured paper with real drop
 * shadows cannot sit on a flat, crisp interface, however carefully its colours are matched. See
 * docs/illustration.md, which records what it took to find that out.
 */

/** The drawing's own coordinate space. */
export const ART_WIDTH = 380;
export const ART_HEIGHT = 190;

export const ART_ALT =
  "A syllabus on the left, its dates flying across into a calendar on the right";

/** The syllabus, and its printed lines: distance down the page, and how wide. */
export const SHEET = { x: 14, y: 20, w: 104, h: 150 };
export const SHEET_LINES = [
  { y: 40, w: 58 },
  { y: 52, w: 74 },
  { y: 64, w: 46 },
  { y: 76, w: 68 },
  { y: 88, w: 52 },
  { y: 100, w: 70 },
];

/** The calendar, and the grid of days inside it. */
export const CAL = { x: 234, y: 26, w: 132, h: 138, header: 28 };
export const GRID = {
  cols: 5,
  rows: 4,
  size: 17,
  pitch: 23,
  left: 246,
  top: 66,
};

export function dayBox(col: number, row: number) {
  return {
    x: GRID.left + col * GRID.pitch,
    y: GRID.top + row * GRID.pitch,
    size: GRID.size,
  };
}

/** The days that fill in, and the order they do it in. */
export const FILLED: { col: number; row: number; order: number }[] = [
  { col: 1, row: 0, order: 0 },
  { col: 3, row: 1, order: 1 },
  { col: 0, row: 2, order: 2 },
  { col: 4, row: 2, order: 3 },
  { col: 2, row: 3, order: 4 },
];

/** A date in transit, at the start of its flight. It crosses the gap and lands on the calendar. */
export const CHIP = { x: 126, y: 82, w: 44, h: 20 };

/**
 * What each half is, for the spots that show only one.
 *
 * A little air is left around each so a crop does not look sheared off at the edge.
 */
export const CROP = {
  document: `${SHEET.x - 8} ${SHEET.y - 10} ${SHEET.w + 16} ${SHEET.h + 20}`,
  calendar: `${CAL.x - 10} ${CAL.y - 16} ${CAL.w + 20} ${CAL.h + 32}`,
} as const;
export type ArtPart = keyof typeof CROP;

/**
 * The colours, named once.
 *
 * On the site these are the palette's own custom properties, so the drawing changes with the
 * theme and needs no second copy. The link preview renders outside a browser, where custom
 * properties do not exist, so it passes the light palette's values in literally.
 */
export type ArtInk = {
  surface: string;
  line: string;
  sunk: string;
  accent: string;
  deep: string;
  ink: string;
};

export const THEME_INK: ArtInk = {
  surface: "var(--elev)",
  line: "var(--line-strong)",
  sunk: "var(--sunk)",
  accent: "var(--accent)",
  deep: "var(--accent-strong)",
  ink: "var(--accent-ink)",
};

export const LIGHT_INK: ArtInk = {
  surface: "#ffffff",
  line: "#d4cec0",
  sunk: "#f4f2ec",
  accent: "#0d7a5c",
  deep: "#085d46",
  ink: "#ffffff",
};
